import { state } from './state.js';
import { refreshIcons } from './utils.js';

// ─── Filter ──────────────────────────────────────────────────────────────────

/**
 * Applies the environment checkbox filter + search term to approvalTasksData,
 * then sorts the result. Callers are responsible for rendering the table.
 */
export function filterTasks(searchTerm) {
  const environmentList = document.getElementById('environmentList');
  let envFiltered = state.approvalTasksData;

  if (environmentList) {
    const selectedEnvIds = Array.from(
      environmentList.querySelectorAll('.environment-checkbox:checked')
    ).map(cb => cb.value);

    envFiltered = state.approvalTasksData.filter(task =>
      selectedEnvIds.includes(task.environmentId)
    );
  }

  if (!searchTerm) {
    state.filteredTasksData = [...envFiltered];
  } else {
    state.filteredTasksData = envFiltered.filter(task => {
      const props = task.properties || {};
      return (
        props.title?.toLowerCase().includes(searchTerm) ||
        task.displayName?.toLowerCase().includes(searchTerm) ||
        task.environmentName?.toLowerCase().includes(searchTerm) ||
        task.state?.toLowerCase().includes(searchTerm) ||
        task.result?.toLowerCase().includes(searchTerm)
      );
    });
  }

  sortTasks(state.currentSort.field, state.currentSort.direction);
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export function handleSort(field) {
  if (state.currentSort.field === field) {
    state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.currentSort.field = field;
    state.currentSort.direction = 'asc';
  }
  sortTasks(field, state.currentSort.direction);
}

export function sortTasks(field, direction) {
  const priorityOrder = { High: 3, Medium: 2, Normal: 2, Low: 1 };

  state.filteredTasksData.sort((a, b) => {
    const pA = a.properties || {};
    const pB = b.properties || {};
    let aVal, bVal;

    switch (field) {
      case 'title':
        aVal = pA.title || '';
        bVal = pB.title || '';
        break;
      case 'environment':
        aVal = a.environmentName || '';
        bVal = b.environmentName || '';
        break;
      case 'creationDate':
        aVal = new Date(pA.creationDate || 0);
        bVal = new Date(pB.creationDate || 0);
        break;
      case 'priority':
        aVal = priorityOrder[pA.priority] ?? 2;
        bVal = priorityOrder[pB.priority] ?? 2;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// ─── DOM counters & sort icons ────────────────────────────────────────────────

export function updateSortIcons() {
  document.querySelectorAll('.sortable-header').forEach(header => {
    header.classList.remove('sorted');
    const icon = header.querySelector('.sort-icon');
    if (icon) icon.setAttribute('data-lucide', 'arrow-up-down');
  });

  const current = document.querySelector(`[data-sort="${state.currentSort.field}"]`);
  if (current) {
    current.classList.add('sorted');
    const icon = current.querySelector('.sort-icon');
    if (icon) {
      icon.setAttribute('data-lucide', state.currentSort.direction === 'asc' ? 'arrow-up' : 'arrow-down');
    }
  }

  refreshIcons();
}

export function updateTaskCount() {
  const el = document.getElementById('taskCount');
  if (el) {
    const count = state.filteredTasksData.length;
    el.textContent = `${count} task${count !== 1 ? 's' : ''}`;
  }
}

export function updateFilteredCount() {
  const el = document.getElementById('filteredCount');
  if (el) {
    const total = state.approvalTasksData.length;
    const filtered = state.filteredTasksData.length;
    el.textContent = filtered < total ? `Showing ${filtered} of ${total}` : '';
  }
}
