export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

export function showStatusMessage(message, type = 'info') {
  const statusMessage = document.getElementById('statusMessage');
  if (statusMessage) {
    statusMessage.className = `mb-4 p-3 rounded-md border status-${type}`;
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden');

    if (type === 'success') {
      setTimeout(() => {
        statusMessage.classList.add('hidden');
      }, 5000);
    }
  }
}

export function getPriorityBadgeClass(priority) {
  const p = priority.toLowerCase();
  if (p.includes('high')) return 'bg-red-100 text-red-800';
  if (p.includes('medium') || p.includes('normal')) return 'bg-yellow-100 text-yellow-800';
  if (p.includes('low')) return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
}

export function getButtonClass(option) {
  const o = option.toLowerCase();
  if (o.includes('approve') || o.includes('accept')) return 'bg-green-100 text-green-800';
  if (o.includes('reject') || o.includes('decline') || o.includes('deny')) return 'bg-red-100 text-red-800';
  if (o.includes('complete') || o.includes('finish')) return 'bg-blue-100 text-blue-800';
  if (o.includes('comment') || o.includes('request')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

export function getButtonIcon(option) {
  const o = option.toLowerCase();
  if (o.includes('approve') || o === 'ok') return '<i data-lucide="check" class="w-3 h-3"></i>';
  if (o.includes('reject') || o.includes('deny') || o.includes('not ok')) return '<i data-lucide="x" class="w-3 h-3"></i>';
  return '<i data-lucide="circle" class="w-3 h-3"></i>';
}

export function getStatusBadgeClass(status) {
  const s = status.toLowerCase();
  if (s.includes('pending')) return 'status-pending';
  if (s.includes('approved')) return 'status-approved';
  if (s.includes('rejected') || s.includes('denied')) return 'status-rejected';
  if (s.includes('completed')) return 'status-completed';
  return 'status-default';
}
