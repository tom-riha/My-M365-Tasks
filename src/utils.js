import { useState, useEffect } from 'react';

export function useIsMobile(bp = 820) {
  const [mobile, setMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= bp
  );
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= bp);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp]);
  return mobile;
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

export function nameToInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export function nameToHue(str = '') {
  let hash = 0;
  for (const c of str) hash = ((hash * 31) + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash) % 360;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

// Short relative time for "last refreshed" labels, e.g. "just now", "5m ago".
export function formatRelativeTime(timestamp) {
  if (!timestamp) return null;
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDate(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Returns { kind, label } describing a task's due/completion state, given the
// normalized { fields: { Complete, DueDate, CompletionDate, CompletedByLookupId } } shape
// that api/planner.js and api/todo.js produce.
export function dueInfo(task) {
  if (task.fields.Complete) {
    if (!task.fields.CompletedByLookupId) return null; // cancelled — no pill
    const label = task.fields.CompletionDate
      ? `Completed ${new Date(task.fields.CompletionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
      : 'Completed';
    return { kind: 'done', label };
  }
  if (!task.fields.DueDate) return { kind: 'future', label: 'No due date' };

  const due = new Date(task.fields.DueDate);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart   = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays   = Math.round((dueStart - todayStart) / 86400000);
  const fmt = due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  if (diffDays < 0)  return { kind: 'overdue', label: `${fmt} · ${Math.abs(diffDays)}d overdue` };
  if (diffDays === 0) return { kind: 'today',   label: `${fmt} · today` };
  if (diffDays === 1) return { kind: 'soon',    label: `${fmt} · tomorrow` };
  if (diffDays <= 7)  return { kind: 'soon',    label: `${fmt} · ${diffDays}d` };
  return { kind: 'future', label: `${fmt} · ${diffDays}d` };
}
