import { state } from './state.js';
import {
  escapeHtml,
  refreshIcons,
  showStatusMessage,
  getPriorityBadgeClass,
  getButtonClass,
  getButtonIcon,
} from './utils.js';
import {
  filterTasks,
  handleSort,
  updateSortIcons,
  updateTaskCount,
  updateFilteredCount,
} from './filters.js';
import { handleApprovalResponse, refreshEnvironmentTasks } from './api.js';

// ─── Filter + render pipeline ─────────────────────────────────────────────────

export function applyFiltersAndRender(searchTerm = '') {
  filterTasks(searchTerm);
  renderTable();
  updateTaskCount();
  updateFilteredCount();
}

// ─── Event binding ────────────────────────────────────────────────────────────

export function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const term = this.value.toLowerCase();
      applyFiltersAndRender(term);
      clearSearchBtn?.classList.toggle('hidden', !term);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function () {
      searchInput.value = '';
      applyFiltersAndRender('');
      this.classList.add('hidden');
    });
  }
}

export function initializeSort() {
  document.addEventListener('click', function (e) {
    const header = e.target.closest('.sortable-header');
    if (!header) return;

    const sortField = header.getAttribute('data-sort');
    handleSort(sortField);
    updateSortIcons();
    renderTable();
    updateTaskCount();
    updateFilteredCount();
  });
}

// ─── Loading state ────────────────────────────────────────────────────────────

export function setLoadingState(isLoading) {
  const loadButton = document.getElementById('loadFlowsButton');
  const loadingState = document.getElementById('loadingState');
  const approvalsTable = document.getElementById('approvalsTable');
  const emptyState = document.getElementById('emptyState');

  if (loadButton) {
    loadButton.classList.toggle('loading', isLoading);
    loadButton.disabled = isLoading;
  }

  if (isLoading) {
    loadingState?.classList.remove('hidden');
    approvalsTable?.classList.add('hidden');
    emptyState?.classList.add('hidden');
  } else {
    loadingState?.classList.add('hidden');
  }
}

// ─── Display tasks ────────────────────────────────────────────────────────────

export function displayApprovalTasks(approvalTasks) {
  const approvalsSection = document.getElementById('approvalsSection');
  const approvalsTable = document.getElementById('approvalsTable');
  const tableControls = document.getElementById('tableControls');
  const emptyState = document.getElementById('emptyState');

  approvalsSection?.classList.remove('hidden');

  if (approvalTasks && approvalTasks.length > 0) {
    state.filteredTasksData = [...approvalTasks];

    handleSort(state.currentSort.field); // re-sort with current direction
    // reset so the first click after load doesn't flip direction unexpectedly
    state.currentSort.direction = 'desc';
    filterTasks('');
    updateSortIcons();
    updateTaskCount();

    tableControls?.classList.remove('hidden');
    approvalsTable?.classList.remove('hidden');
    emptyState?.classList.add('hidden');

    renderTable();
    updateFilteredCount();
  } else {
    tableControls?.classList.add('hidden');
    approvalsTable?.classList.add('hidden');
    emptyState?.classList.remove('hidden');
  }
}

// ─── Environment selection ────────────────────────────────────────────────────

export function displayEnvironmentSelection(environments) {
  const environmentSelection = document.getElementById('environmentSelection');
  const environmentList = document.getElementById('environmentList');
  if (!environmentSelection || !environmentList) return;

  state.userEnvironments = environments;

  const sorted = [...environments].sort((a, b) => {
    const aName = a.properties?.displayName ?? a.name;
    const bName = b.properties?.displayName ?? b.name;
    const aDefault = a.name.startsWith('Default-');
    const bDefault = b.name.startsWith('Default-');
    if (aDefault && !bDefault) return -1;
    if (!aDefault && bDefault) return 1;
    return aName.localeCompare(bName);
  });

  environmentList.innerHTML = '';

  sorted.forEach(env => {
    const displayName = env.properties?.displayName ?? env.name;
    const envId = env.name;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center space-x-2 p-1.5 hover:bg-white rounded transition-colors';
    wrapper.innerHTML = `
      <input
        type="checkbox"
        id="env-${envId}"
        value="${envId}"
        class="environment-checkbox h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        checked
      >
      <label for="env-${envId}" class="text-xs font-medium text-gray-700 cursor-pointer flex-1 leading-tight">
        ${escapeHtml(displayName)}
      </label>
    `;
    environmentList.appendChild(wrapper);
  });

  const checkboxes = environmentList.querySelectorAll('.environment-checkbox');

  checkboxes.forEach(cb =>
    cb.addEventListener('change', () => {
      const term = document.getElementById('searchInput')?.value.toLowerCase() ?? '';
      applyFiltersAndRender(term);
    })
  );

  document.getElementById('selectAllEnvs')?.addEventListener('click', () => {
    checkboxes.forEach(cb => (cb.checked = true));
    const term = document.getElementById('searchInput')?.value.toLowerCase() ?? '';
    applyFiltersAndRender(term);
  });

  document.getElementById('deselectAllEnvs')?.addEventListener('click', () => {
    checkboxes.forEach(cb => (cb.checked = false));
    const term = document.getElementById('searchInput')?.value.toLowerCase() ?? '';
    applyFiltersAndRender(term);
  });

  environmentSelection.classList.remove('hidden');
}

// ─── Table rendering ──────────────────────────────────────────────────────────

export function renderTable() {
  const body = document.getElementById('approvalsTableBody');
  if (!body) return;

  body.innerHTML = '';
  state.filteredTasksData.forEach((task, index) => {
    body.appendChild(createApprovalTaskRow(task, index));
  });

  refreshIcons();
}

function createApprovalTaskRow(task, index) {
  const props = task.properties || {};
  const title = props.title || 'N/A';
  const creationDate = props.creationDate || null;
  const priority = props.priority || 'Medium';
  const environmentName = task.environmentName || 'Unknown Environment';
  const responseOptions = props.userRequest?.responseOptions ?? ['Approve', 'Reject'];

  const row = document.createElement('tr');
  row.className = `table-row border-b border-gray-100 transition-colors duration-150 ${
    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
  }`;

  const formattedDate = creationDate
    ? new Date(creationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  row.innerHTML = `
    <td class="py-4 px-4">
      <div class="font-medium text-gray-900 text-sm leading-tight">${escapeHtml(title)}</div>
    </td>
    <td class="py-4 px-4">
      <div class="text-sm text-gray-600">${escapeHtml(environmentName)}</div>
    </td>
    <td class="py-4 px-4">
      <div class="text-sm text-gray-600">${formattedDate}</div>
    </td>
    <td class="py-4 px-4">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(priority)}">
        ${escapeHtml(priority)}
      </span>
    </td>
    <td class="py-4 px-4">
      ${createViewButton(task)}
    </td>
    <td class="py-4 px-4">
      <div class="flex flex-wrap gap-2">
        ${createActionButtons(task, responseOptions)}
      </div>
    </td>
  `;

  return row;
}

function createViewButton(task) {
  const envId = task.environmentId;
  const link = `https://make.powerautomate.com/environments/${encodeURIComponent(envId)}/approvals/received/${encodeURIComponent(task.name)}`;

  return `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      onclick="window.open('${link}', '_blank')"
      title="Open in Power Automate"
      style="cursor: pointer;"
    >
      <i data-lucide="external-link" class="w-3 h-3"></i>
      <span style="margin-left: 2px;">Open</span>
    </span>
  `;
}

function createActionButtons(task, responseOptions) {
  return responseOptions
    .map(option => {
      const btnId = `btn-${task.environmentId}-${task.name}-${option}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      return `
        <span
          id="${btnId}"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getButtonClass(option)}"
          onclick="handleApprovalResponseWithLoading(this, '${task.environmentId}', '${task.name}', '${option}')"
          title="${option} this approval task"
          style="cursor: pointer; margin-right: 4px; margin-bottom: 2px;"
        >
          ${getButtonIcon(option)}
          <span style="margin-left: 2px;">${escapeHtml(option)}</span>
        </span>
      `;
    })
    .join('');
}

// ─── Action button loading ────────────────────────────────────────────────────

export function hideAllActionButtonsInRow(environmentId, taskId) {
  const prefix = `btn-${environmentId}-${taskId}`.replace(/[^a-zA-Z0-9-_]/g, '-');
  document.querySelectorAll(`[id^="${prefix}"]`).forEach(btn => {
    btn.style.display = 'none';
  });
}

const LOADING_SPINNER = `
  <div class="inline-flex items-center">
    <svg class="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span style="margin-left: 4px;">Processing...</span>
  </div>
`;

export async function handleApprovalResponseWithLoading(buttonElement, environmentId, taskId, response) {
  const originalHTML = buttonElement.innerHTML;
  const originalOnClick = buttonElement.onclick;

  buttonElement.innerHTML = LOADING_SPINNER;
  buttonElement.style.cursor = 'not-allowed';
  buttonElement.style.opacity = '0.7';
  buttonElement.onclick = null;

  try {
    await handleApprovalResponse(environmentId, taskId, response);

    setTimeout(async () => {
      hideAllActionButtonsInRow(environmentId, taskId);
      await refreshEnvironmentTasks(environmentId);
      const term = document.getElementById('searchInput')?.value.toLowerCase() ?? '';
      applyFiltersAndRender(term);
    }, 500);
  } catch (error) {
    console.error('Error responding to approval:', error);
    showStatusMessage(error.message, 'error');
    buttonElement.innerHTML = originalHTML;
    buttonElement.style.cursor = 'pointer';
    buttonElement.style.opacity = '1';
    buttonElement.onclick = originalOnClick;
  }
}
