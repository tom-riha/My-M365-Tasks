import { Icon } from './Icon.jsx';

export function DemoBanner() {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        '7px 16px',
        background:     'var(--warn-soft)',
        borderBottom:   '1px solid oklch(0.85 0.1 60)',
        color:          'oklch(0.42 0.14 60)',
        fontSize:       12.5,
        fontWeight:     500,
        flexShrink:     0,
      }}
    >
      <Icon n="info" size={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        You're viewing demo data — nothing here is real, and nothing is saved or sent anywhere.
      </span>
      <button
        onClick={() => location.reload()}
        style={{
          padding:      '4px 10px',
          borderRadius: 6,
          background:   'oklch(0.42 0.14 60)',
          color:        'white',
          fontWeight:   600,
          fontSize:     12,
          flexShrink:   0,
        }}
      >
        Exit demo
      </button>
    </div>
  );
}
