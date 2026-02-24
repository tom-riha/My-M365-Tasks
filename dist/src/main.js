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
} from './ui.js';

// Expose the onclick handler used in dynamically generated table rows
window.handleApprovalResponseWithLoading = handleApprovalResponseWithLoading;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  initializePrivacyNotice();
  initializeMSAL();

  document.getElementById('signInButton')?.addEventListener('click', signIn);
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
