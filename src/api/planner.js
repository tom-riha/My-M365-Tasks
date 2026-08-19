import { acquireGraphToken, gFetch, fetchAllPages } from './graph.js';

const BATCH_URL = 'https://graph.microsoft.com/v1.0/$batch';
const BATCH_SIZE = 4;
const MAX_ROUNDS = 4;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Normalization ────────────────────────────────────────────────────────────

// Map a Microsoft Planner task into the SharePoint-item-like shape that
// TaskCard/TaskView/dueInfo() already expect.
function normalizePlannerTask(task, planTitle, currentUser) {
  return {
    id:            `planner:${task.id}`,
    source:        'planner',
    plannerTaskId: task.id,
    fields: {
      Title:                  task.title,
      Complete:               task.percentComplete === 100,
      DueDate:                task.dueDateTime ?? null,
      CompletionDate:         task.completedDateTime ?? null,
      CompletedByLookupId:    task.percentComplete === 100 ? 'me' : null,
      CompletedByLookupValue: currentUser.name,
      Created:                task.createdDateTime,
      Description:            '', // not included here — lazy-loaded by the detail panel
      SourceLabel:            planTitle,
    },
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

// Resolve plan titles for a set of plan IDs via $batch (max 20 sub-requests per
// call, sent in small sequential batches to avoid throttling — same pattern as
// src/api/todo.js's list fetch, but kept local since the retry bookkeeping
// differs slightly).
async function fetchPlanTitles(planIds, token) {
  const titles = new Map();
  let remaining = planIds;

  for (let round = 0; round < MAX_ROUNDS && remaining.length > 0; round++) {
    if (round > 0) await sleep(1000 * round);
    const throttled = [];

    for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
      const chunk = remaining.slice(i, i + BATCH_SIZE);
      const requests = chunk.map((planId, idx) => ({
        id:     String(idx),
        method: 'GET',
        url:    `/planner/plans/${encodeURIComponent(planId)}`,
      }));

      const { responses } = await gFetch(BATCH_URL, token, {
        method: 'POST',
        body:   JSON.stringify({ requests }),
      });

      for (const res of responses) {
        const planId = chunk[Number(res.id)];
        if (res.status === 429) {
          throttled.push(planId);
          continue;
        }
        if (res.status >= 400) {
          console.error(`Planner plan fetch error for "${planId}":`, res.status, res.body);
          continue;
        }
        titles.set(planId, res.body.title);
      }
    }

    remaining = throttled;
  }

  if (remaining.length > 0) {
    console.error('Planner plans still throttled after retries:', remaining);
  }

  return titles;
}

export async function fetchAllPlannerTasks(instance, currentUser) {
  const token = await acquireGraphToken(instance);

  const allTasks = await fetchAllPages('https://graph.microsoft.com/v1.0/me/planner/tasks', token);
  const tasks = allTasks.filter((t) => t.percentComplete !== 100);
  if (tasks.length === 0) return [];

  const planIds = [...new Set(tasks.map((t) => t.planId))];
  const titles = await fetchPlanTitles(planIds, token);

  return tasks.map((t) => normalizePlannerTask(t, titles.get(t.planId) ?? 'Planner', currentUser));
}

// Description and checklist items aren't returned by /me/planner/tasks —
// fetch on demand when the detail panel opens.
export async function fetchPlannerTaskDetails(instance, taskId) {
  const token = await acquireGraphToken(instance);
  const details = await gFetch(`https://graph.microsoft.com/v1.0/planner/tasks/${encodeURIComponent(taskId)}/details`, token);

  const checklist = Object.entries(details.checklist ?? {})
    .map(([id, item]) => ({ id, title: item.title, isChecked: item.isChecked, orderHint: item.orderHint }))
    .sort((a, b) => a.orderHint.localeCompare(b.orderHint));

  return { description: details.description ?? '', checklist };
}

// Toggling a checklist item requires the details object's current ETag
// (optimistic concurrency) — fetch fresh immediately before PATCHing.
export async function setChecklistItemChecked(instance, taskId, itemId, isChecked) {
  const token = await acquireGraphToken(instance);
  const details = await gFetch(`https://graph.microsoft.com/v1.0/planner/tasks/${encodeURIComponent(taskId)}/details`, token);

  await gFetch(
    `https://graph.microsoft.com/v1.0/planner/tasks/${encodeURIComponent(taskId)}/details`,
    token,
    {
      method:  'PATCH',
      headers: { 'If-Match': details['@odata.etag'] },
      body:    JSON.stringify({
        checklist: {
          [itemId]: { '@odata.type': '#microsoft.graph.plannerChecklistItem', isChecked },
        },
      }),
    }
  );
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function completePlannerTask(instance, taskId) {
  const token = await acquireGraphToken(instance);

  // Completing requires the current ETag (optimistic concurrency) — fetch the
  // task fresh immediately before PATCHing.
  const task = await gFetch(`https://graph.microsoft.com/v1.0/planner/tasks/${encodeURIComponent(taskId)}`, token);

  await gFetch(
    `https://graph.microsoft.com/v1.0/planner/tasks/${encodeURIComponent(taskId)}`,
    token,
    {
      method:  'PATCH',
      headers: { 'If-Match': task['@odata.etag'] },
      body:    JSON.stringify({ percentComplete: 100 }),
    }
  );
}
