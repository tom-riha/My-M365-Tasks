import { state } from './state.js';
import { showStatusMessage } from './utils.js';

// ─── Token helper ─────────────────────────────────────────────────────────────

async function acquireToken(scopes) {
  const account = state.msalInstance.getActiveAccount();
  if (!account) throw new Error('No active account. Please sign in again.');

  try {
    const { accessToken } = await state.msalInstance.acquireTokenSilent({ scopes, account });
    return accessToken;
  } catch (err) {
    if (err instanceof msal.InteractionRequiredAuthError) {
      const { accessToken } = await state.msalInstance.acquireTokenPopup({ scopes, account });
      return accessToken;
    }
    throw err;
  }
}

const FLOW_SCOPES = ['https://service.flow.microsoft.com/.default'];

// ─── Environments ─────────────────────────────────────────────────────────────

export async function fetchUserEnvironments() {
  const token = await acquireToken(FLOW_SCOPES);

  const res = await fetch(
    'https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/',
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Error fetching environments: ${err.error?.message ?? 'Unknown error'}`);
  }

  const data = await res.json();
  state.userEnvironments = data.value ?? [];
  return state.userEnvironments;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function fetchApprovalTasksFromEnvironment(environmentId, environmentInfo) {
  try {
    const token = await acquireToken(FLOW_SCOPES);

    const url =
      `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/` +
      `${encodeURIComponent(environmentId)}/approvalViews` +
      `?$filter=properties%2FuserRole+eq+%27Approver%27+and+properties%2FisActive+eq+%27true%27`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.value ?? []).map(task => ({
      ...task,
      environmentId,
      environmentName: environmentInfo.properties?.displayName ?? environmentId,
      environmentRegion: environmentInfo.properties?.azureRegion ?? 'Unknown',
    }));
  } catch (error) {
    console.error(`Error fetching tasks from environment ${environmentId}:`, error);
    return [];
  }
}

// ─── Respond to approval ──────────────────────────────────────────────────────

/** Submits an approval response. Throws on failure — callers handle status UI. */
export async function handleApprovalResponse(environmentId, taskId, response, comment = '') {
  const token = await acquireToken(FLOW_SCOPES);

  const url =
    `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/` +
    `${encodeURIComponent(environmentId)}/approvals/${encodeURIComponent(taskId)}/approvalResponses`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { response, comments: comment || `${response} via Task Central` },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Error ${response.toLowerCase()}ing task: ${err.error?.message ?? 'Unknown error'}`);
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

/**
 * Refreshes tasks for a single environment in state.approvalTasksData.
 * Does not trigger any rendering — the caller is responsible.
 */
export async function refreshEnvironmentTasks(environmentId) {
  const environmentInfo = state.userEnvironments.find(env => env.name === environmentId);
  if (!environmentInfo) {
    console.error(`Environment ${environmentId} not found in userEnvironments`);
    return;
  }

  try {
    const updatedTasks = await fetchApprovalTasksFromEnvironment(environmentId, environmentInfo);
    state.approvalTasksData = state.approvalTasksData.filter(t => t.environmentId !== environmentId);
    state.approvalTasksData.push(...updatedTasks);
  } catch (error) {
    showStatusMessage(`Error refreshing environment: ${error.message}`, 'error');
  }
}
