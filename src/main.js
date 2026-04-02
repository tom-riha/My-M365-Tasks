import { initializeMSAL, signIn } from './auth.js';
import { fetchUserEnvironments, fetchApprovalTasksFromEnvironment } from './api.js';
import { state } from './state.js';
import { showStatusMessage } from './utils.js';
import {
  setLoadingState,
  displayApprovalTasks,
  displayEnvironmentSelection,
  initializeSearch,
  initializeSort,
  handleApprovalResponseWithLoading,
  showTaskDetailModal,
} from './ui.js';

// Expose onclick handlers used in dynamically generated table rows
window.handleApprovalResponseWithLoading = handleApprovalResponseWithLoading;
window.showTaskDetailModal = showTaskDetailModal;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  initializePrivacyNotice();
  initializeMSAL();

  const deeplink = getDeeplinkParams();
  if (deeplink) {
    document.getElementById('deeplinkNotice')?.classList.remove('hidden');
  }

  document.getElementById('signInButton')?.addEventListener('click', async () => {
    await signIn();
    if (state.msalInstance.getActiveAccount()) {
      document.getElementById('deeplinkNotice')?.classList.add('hidden');
      if (deeplink) {
        await loadApprovalTasksWithDeeplink(deeplink.environmentId, deeplink.taskId);
      } else {
        await loadApprovalTasks();
      }
    }
  });
  document.getElementById('loadFlowsButton')?.addEventListener('click', loadApprovalTasks);

  initializeSearch();
  initializeSort();
});

// ─── Privacy notice ───────────────────────────────────────────────────────────

function initializePrivacyNotice() {
  const notice = document.getElementById('privacyNotice');
  const closeBtn = document.getElementById('closePrivacyNotice');

  if (notice && closeBtn) {
    if (localStorage.getItem('privacyNoticeDismissed') === 'true') {
      notice.style.display = 'none';
    }

    closeBtn.addEventListener('click', () => {
      notice.style.display = 'none';
      localStorage.setItem('privacyNoticeDismissed', 'true');
    });
  }
}

// ─── Deep-link support ───────────────────────────────────────────────────────

/**
 * Returns { environmentId, taskId } from the URL query string, or null if
 * either parameter is missing.  Expected format:
 *   ?environmentId=<env-id>&taskId=<approval-id>
 */
function getDeeplinkParams() {
  const params = new URLSearchParams(location.search);
  const environmentId = params.get('environmentId');
  const taskId = params.get('taskId');
  return environmentId && taskId ? { environmentId, taskId } : null;
}

// ─── Load all approval tasks ──────────────────────────────────────────────────

async function loadApprovalTasks() {
  try {
    setLoadingState(true);

    const environments = await fetchUserEnvironments();

    if (environments.length === 0) {
      showStatusMessage('No environments found or you do not have access to any environments.', 'warning');
      return;
    }

    displayEnvironmentSelection(environments);

    const taskResults = await Promise.all(
      environments.map(env => fetchApprovalTasksFromEnvironment(env.name, env))
    );

    state.approvalTasksData = taskResults.flat();
    state.filteredTasksData = [...state.approvalTasksData];

    displayApprovalTasks(state.approvalTasksData);
  } catch (error) {
    if (error instanceof msal.InteractionRequiredAuthError) {
      try {
        await state.msalInstance.acquireTokenPopup({
          scopes: ['https://service.flow.microsoft.com/.default'],
          account: state.msalInstance.getActiveAccount(),
        });
        await loadApprovalTasks();
      } catch (popupError) {
        showStatusMessage(`Authentication error: ${popupError.message}`, 'error');
      }
    } else {
      showStatusMessage(`Error loading approval tasks: ${error.message}`, 'error');
      console.error('Error:', error);
    }
  } finally {
    setLoadingState(false);
  }
}

// ─── Deep-link task loader ────────────────────────────────────────────────────

/**
 * Fetches the target environment first so the linked task modal can open
 * quickly, then loads remaining environments in the background.
 */
async function loadApprovalTasksWithDeeplink(targetEnvId, targetTaskId) {
  try {
    setLoadingState(true);

    const environments = await fetchUserEnvironments();
    if (environments.length === 0) {
      showStatusMessage('No environments found or you do not have access to any environments.', 'warning');
      return;
    }

    displayEnvironmentSelection(environments);

    const targetEnv = environments.find(e => e.name === targetEnvId);
    if (!targetEnv) {
      showStatusMessage('The linked environment was not found in your account. Loading all tasks instead.', 'warning');
      const taskResults = await Promise.all(
        environments.map(env => fetchApprovalTasksFromEnvironment(env.name, env))
      );
      state.approvalTasksData = taskResults.flat();
      state.filteredTasksData = [...state.approvalTasksData];
      displayApprovalTasks(state.approvalTasksData);
      return;
    }

    // Fetch the target environment first so the modal can open quickly
    const targetTasks = await fetchApprovalTasksFromEnvironment(targetEnv.name, targetEnv);

    // Seed state so showTaskDetailModal can locate the task
    state.approvalTasksData = [...targetTasks];
    state.filteredTasksData = [...targetTasks];

    const sanitizedId = targetTaskId.replace(/[^a-zA-Z0-9-_]/g, '-');
    const taskFound = targetTasks.some(
      t => t.name === targetTaskId || t.name.replace(/[^a-zA-Z0-9-_]/g, '-') === sanitizedId
    );

    if (taskFound) {
      showTaskDetailModal(sanitizedId);
    } else {
      showStatusMessage('The linked approval task was not found or has already been completed.', 'warning');
    }

    // Load remaining environments in the background while the user reviews the modal
    const remainingEnvs = environments.filter(e => e.name !== targetEnvId);
    const remainingResults = await Promise.all(
      remainingEnvs.map(env => fetchApprovalTasksFromEnvironment(env.name, env))
    );

    const allTasks = [...targetTasks, ...remainingResults.flat()];
    state.approvalTasksData = allTasks;
    state.filteredTasksData = [...allTasks];
    displayApprovalTasks(allTasks);

  } catch (error) {
    if (error instanceof msal.InteractionRequiredAuthError) {
      try {
        await state.msalInstance.acquireTokenPopup({
          scopes: ['https://service.flow.microsoft.com/.default'],
          account: state.msalInstance.getActiveAccount(),
        });
        await loadApprovalTasksWithDeeplink(targetEnvId, targetTaskId);
      } catch (popupError) {
        showStatusMessage(`Authentication error: ${popupError.message}`, 'error');
      }
    } else {
      showStatusMessage(`Error loading approval tasks: ${error.message}`, 'error');
      console.error('Error:', error);
    }
  } finally {
    setLoadingState(false);
  }
}
