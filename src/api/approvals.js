import { FLOW_SCOPES } from '../config.js';
import { acquireToken } from './authToken.js';

const FLOW_BASE = 'https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple';

// ─── Token helper ─────────────────────────────────────────────────────────────

export async function acquireFlowToken(instance) {
  return acquireToken(instance, FLOW_SCOPES);
}

async function flowFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Environments ─────────────────────────────────────────────────────────────

async function fetchUserEnvironments(token) {
  const data = await flowFetch(`${FLOW_BASE}/environments/`, token);
  return data.value ?? [];
}

// ─── Approval tasks ───────────────────────────────────────────────────────────

async function fetchApprovalTasksFromEnvironment(token, environmentInfo) {
  const environmentId = environmentInfo.name;
  const url =
    `${FLOW_BASE}/environments/${encodeURIComponent(environmentId)}/approvalViews` +
    `?$filter=properties%2FuserRole+eq+%27Approver%27+and+properties%2FisActive+eq+%27true%27`;

  try {
    const data = await flowFetch(url, token);
    return (data.value ?? []).map((task) => ({
      ...task,
      environmentId,
      environmentName: environmentInfo.properties?.displayName ?? environmentId,
    }));
  } catch {
    // Some environments may not have approvals enabled or the user may lack access — skip them.
    return [];
  }
}

/**
 * Fetches pending approval tasks (where the user is the approver) across every
 * environment they can access, alongside the full environment list itself (so
 * callers can show e.g. "which environments do I have access to" even for
 * environments with nothing currently pending).
 */
export async function fetchAllApprovalTasks(instance) {
  const token = await acquireFlowToken(instance);
  const environments = await fetchUserEnvironments(token);
  const perEnvironment = await Promise.all(
    environments.map((env) => fetchApprovalTasksFromEnvironment(token, env))
  );
  return {
    tasks: perEnvironment.flat(),
    environments: environments.map((env) => ({
      id:   env.name,
      name: env.properties?.displayName ?? env.name,
    })),
  };
}

// ─── Respond to an approval ───────────────────────────────────────────────────

/** Submits an approval response (Approve/Reject/…). Throws on failure — callers handle status UI. */
export async function submitApprovalResponse(instance, environmentId, taskId, response, comment = '') {
  const token = await acquireFlowToken(instance);
  const url =
    `${FLOW_BASE}/environments/${encodeURIComponent(environmentId)}` +
    `/approvals/${encodeURIComponent(taskId)}/approvalResponses`;

  await flowFetch(url, token, {
    method: 'POST',
    body: JSON.stringify({
      properties: { response, comments: comment || `${response} via My M365 Tasks` },
    }),
  });
}
