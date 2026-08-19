import { Icon } from '../common/Icon.jsx';

const ITEMS = [
  { id: 'tasks',     label: 'Tasks',     icon: 'inbox' },
  { id: 'approvals', label: 'Approvals', icon: 'bell' },
];

export function MobileBottomNav({ activeView, setActiveView }) {
  return (
    <nav
      style={{
        position:             'fixed',
        bottom:               0,
        left:                 0,
        right:                0,
        zIndex:               25,
        background:           'var(--surface)',
        borderTop:            '1px solid var(--border)',
        padding:              'max(6px, env(safe-area-inset-bottom)) 6px 6px',
        display:              'grid',
        gridTemplateColumns:  `repeat(${ITEMS.length}, 1fr)`,
        gap:                  2,
        boxShadow:            '0 -10px 24px oklch(0 0 0 / 0.04)',
      }}
    >
      {ITEMS.map((item) => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           2,
              padding:       '6px 4px',
              color:         active ? 'var(--accent-ink)' : 'var(--ink-3)',
            }}
          >
            <Icon n={item.icon} size={20} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
