import { nameToHue, nameToInitials } from '../../utils.js';

export function Avatar({ name = '', email = '', size = 24, ring = false }) {
  const hue      = nameToHue(email || name);
  const initials = nameToInitials(name);
  return (
    <span
      style={{
        width:         size,
        height:        size,
        borderRadius:  '50%',
        background:    `oklch(0.93 0.04 ${hue})`,
        color:         `oklch(0.35 0.12 ${hue})`,
        display:       'inline-grid',
        placeItems:    'center',
        fontSize:      Math.round(size * 0.42),
        fontWeight:    600,
        boxShadow:     ring ? '0 0 0 2px var(--surface)' : 'none',
        flexShrink:    0,
        userSelect:    'none',
      }}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ people = [], size = 24, max = 3 }) {
  const shown = people.slice(0, max);
  const extra = people.length - max;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <span key={p.email || p.name || i} style={{ marginLeft: i === 0 ? 0 : -Math.round(size * 0.32) }}>
          <Avatar name={p.name} email={p.email} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{
            marginLeft:  -Math.round(size * 0.32),
            width:       size,
            height:      size,
            borderRadius:'50%',
            background:  'var(--surface-sink)',
            color:       'var(--ink-3)',
            fontSize:    Math.round(size * 0.4),
            fontWeight:  600,
            display:     'inline-grid',
            placeItems:  'center',
            boxShadow:   '0 0 0 2px var(--surface)',
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
