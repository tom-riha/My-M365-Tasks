import { Icon } from './Icon.jsx';

const TONES = {
  neutral: { bg: 'var(--surface-2)',    fg: 'var(--ink-2)',              bd: 'var(--border)' },
  overdue: { bg: 'var(--danger-soft)',  fg: 'var(--danger)',             bd: 'oklch(0.88 0.08 25)' },
  today:   { bg: 'var(--warn-soft)',    fg: 'oklch(0.45 0.15 55)',       bd: 'oklch(0.88 0.09 65)' },
  soon:    { bg: 'var(--info-soft)',    fg: 'var(--info)',               bd: 'oklch(0.89 0.06 230)' },
  future:  { bg: 'var(--surface-2)',    fg: 'var(--ink-3)',              bd: 'var(--border)' },
  done:    { bg: 'var(--ok-soft)',      fg: 'oklch(0.43 0.13 152)',      bd: 'oklch(0.88 0.06 152)' },
  process: { bg: 'var(--process-soft)', fg: 'var(--process)',            bd: 'var(--process-edge)' },
  new:     { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)',          bd: 'var(--accent-edge)' },
};

export function Pill({ tone = 'neutral', icon, children, style = {} }) {
  const m = TONES[tone] ?? TONES.neutral;
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           5,
        padding:       '2px 8px',
        borderRadius:  999,
        fontSize:      11.5,
        fontWeight:    600,
        letterSpacing: '.01em',
        background:    m.bg,
        color:         m.fg,
        border:        `1px solid ${m.bd}`,
        whiteSpace:    'nowrap',
        flexShrink:    0,
        ...style,
      }}
    >
      {icon && <Icon n={icon} size={11} />}
      {children}
    </span>
  );
}
