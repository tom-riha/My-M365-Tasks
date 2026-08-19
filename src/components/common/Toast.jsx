import { useEffect } from 'react';
import { Icon } from './Icon.jsx';
import { useStore } from '../../store.js';

const STYLES = {
  success: { bg: 'var(--ok-soft)',     fg: 'oklch(0.38 0.12 152)', bd: 'oklch(0.85 0.08 152)', icon: 'check' },
  error:   { bg: 'var(--danger-soft)', fg: 'var(--danger)',         bd: 'oklch(0.85 0.1 25)',   icon: 'alert' },
  warning: { bg: 'var(--warn-soft)',   fg: 'oklch(0.42 0.14 60)',   bd: 'oklch(0.85 0.1 60)',   icon: 'alert' },
  info:    { bg: 'var(--info-soft)',   fg: 'var(--info)',           bd: 'oklch(0.85 0.06 230)', icon: 'bell' },
};

export function Toast({ id, msg, type = 'info' }) {
  const removeToast = useStore((s) => s.removeToast);
  const s = STYLES[type] ?? STYLES.info;

  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 4000);
    return () => clearTimeout(t);
  }, [id, removeToast]);

  return (
    <div
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '10px 12px',
        borderRadius:10,
        background:  s.bg,
        color:       s.fg,
        border:      `1px solid ${s.bd}`,
        fontSize:    13,
        fontWeight:  500,
        minWidth:    240,
        maxWidth:    380,
        boxShadow:   '0 6px 24px oklch(0 0 0 / 0.08)',
        animation:   'slideInRight 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      <Icon n={s.icon} size={14} />
      <span style={{ flex: 1, textWrap: 'pretty' }}>{msg}</span>
      <button
        onClick={() => removeToast(id)}
        style={{ color: 'inherit', opacity: 0.6, padding: 2 }}
      >
        <Icon n="x" size={12} />
      </button>
    </div>
  );
}
