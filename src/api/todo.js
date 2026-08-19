import { acquireGraphToken, gFetch, fetchAllPages } from './graph.js';

// Microsoft Graph's gateway decodes path segments once before routing, so
// the typical encodeURIComponent isn't enough for To Do list/task IDs, which
// contain '=', '+', '/' (Outlook-style immutable IDs). Encode twice so the
// literal special characters survive the gateway's single decode pass.
function encodeId(id) {
  return encodeURIComponent(encodeURIComponent(id));
}

// ─── Normalization ────────────────────────────────────────────────────────────

// Map a Microsoft To Do task into the SharePoint-item-like shape that
// TaskCard/TaskView/dueInfo() already expect.
function normalizeTodoTask(task, listId, listName, currentUser) {
  return {
    id:         `todo:${listId}:${task.id}`,
    source:     'todo',
    todoListId: listId,
    todoTaskId: task.id,
    fields: {
      Title:                  task.title,
      Complete:               task.status === 'completed',
      // dueDateTime/completedDateTime are naive datetimes in the given timeZone
      // (usually UTC) — append 'Z' so `new Date(...)` doesn't apply local offset.
      DueDate:                task.dueDateTime       ? `${task.dueDateTime.dateTime}Z`       : null,
      CompletionDate:         task.completedDateTime ? `${task.completedDateTime.dateTime}Z` : null,
      CompletedByLookupId:    task.status === 'completed' ? 'me' : null,
      CompletedByLookupValue: currentUser.name,
      Created:                task.createdDateTime,
      Description:            task.body?.content ?? '',
      SourceLabel:            listName,
    },
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

const BATCH_URL = 'https://graph.microsoft.com/v1.0/$batch';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tasksUrl(listId) {
  // Completed To Do tasks aren't shown in the merged views, so exclude them
  // server-side — keeps lists with long completion histories well under $top.
  return `/me/todo/lists/${encodeURIComponent(listId)}/tasks` +
    '?$select=id,status,dueDateTime,completedDateTime,createdDateTime,body&$top=200' +
    `&$filter=${encodeURIComponent("status ne 'completed'")}`;
}

async function drainPages(firstBody, token) {
  let tasks = firstBody?.value ?? [];
  let nextLink = firstBody?.['@odata.nextLink'];
  while (nextLink) {
    const page = await gFetch(nextLink, token);
    tasks = tasks.concat(page.value ?? []);
    nextLink = page['@odata.nextLink'];
  }
  return tasks;
}

const BATCH_SIZE = 4;
const MAX_ROUNDS = 4;

// Run one $batch call for a set of lists, returning normalized tasks for the
// lists that succeeded and the subset that came back 429 (to retry).
async function fetchListsBatch(lists, token, currentUser) {
  const results = [];
  const throttled = [];

  for (let i = 0; i < lists.length; i += BATCH_SIZE) {
    const chunk = lists.slice(i, i + BATCH_SIZE);
    const requests = chunk.map((list, idx) => ({
      id:     String(idx),
      method: 'GET',
      url:    tasksUrl(list.id),
    }));

    const { responses } = await gFetch(BATCH_URL, token, {
      method: 'POST',
      body:   JSON.stringify({ requests }),
    });

    for (const res of responses) {
      const list = chunk[Number(res.id)];
      if (res.status === 429) {
        throttled.push(list);
        continue;
      }
      if (res.status >= 400) {
        console.error(`To Do batch error for list "${list.displayName}":`, res.status, res.body);
        continue;
      }

      const tasks = await drainPages(res.body, token);
      results.push(...tasks.map((t) => normalizeTodoTask(t, list.id, list.displayName, currentUser)));
    }
  }

  return { results, throttled };
}

export async function fetchAllTodoTasks(instance, currentUser) {
  const token = await acquireGraphToken(instance);

  let lists = await fetchAllPages('https://graph.microsoft.com/v1.0/me/todo/lists', token);
  if (lists.length === 0) return [];

  // Fetch lists' tasks via $batch in small sequential batches (rather than one
  // big batch of 20) — To Do throttles individual sub-requests under bursts
  // (429 activityLimitReached), so smaller batches keep concurrent load low.
  // Any lists that still get throttled are retried in the next round.
  const results = [];
  for (let round = 0; round < MAX_ROUNDS && lists.length > 0; round++) {
    if (round > 0) await sleep(1000 * round);
    const { results: roundResults, throttled } = await fetchListsBatch(lists, token, currentUser);
    results.push(...roundResults);
    lists = throttled;
  }

  if (lists.length > 0) {
    console.error('To Do lists still throttled after retries:', lists.map((l) => l.displayName));
  }

  return results;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function completeTodoTask(instance, listId, taskId) {
  const token = await acquireGraphToken(instance);
  await gFetch(
    `https://graph.microsoft.com/v1.0/me/todo/lists/${encodeId(listId)}/tasks/${encodeId(taskId)}`,
    token,
    { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) }
  );
}
