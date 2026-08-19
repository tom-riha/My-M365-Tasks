const COPY = {
  open:      { title: 'Inbox zero',    sub: 'No open Planner or To Do tasks. New ones will show up here as soon as they land in Microsoft 365.' },
  approvals: { title: 'All caught up', sub: 'No Power Automate approvals are waiting on your decision right now.' },
};

export function EmptyState({ view }) {
  const copy = COPY[view] ?? { title: 'Nothing here', sub: '' };
  return (
    <div
      style={{
        display:     'flex',
        flexDirection:'column',
        alignItems:  'center',
        gap:         16,
        padding:     '72px 20px',
        background:  'var(--surface)',
        border:      '1px dashed var(--border-strong)',
        borderRadius:14,
      }}
    >
      {/* Geometric illustration */}
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="14" y="18" width="92" height="48" rx="8" fill="var(--surface-2)" stroke="var(--border-strong)" />
        <rect x="24" y="30" width="44" height="6" rx="3" fill="var(--border)" />
        <rect x="24" y="42" width="64" height="4" rx="2" fill="var(--border)" />
        <rect x="24" y="52" width="36" height="4" rx="2" fill="var(--border)" />
        <circle cx="92" cy="22" r="10" fill="var(--ok-soft)" stroke="oklch(0.88 0.06 152)" />
        <path d="M88 22l3 3 5-5" stroke="var(--ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>

      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{copy.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, textWrap: 'pretty' }}>{copy.sub}</div>
      </div>
    </div>
  );
}
