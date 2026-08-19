import { useState } from 'react';
import { Icon } from '../common/Icon.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Pill } from '../common/Pill.jsx';
import { useStore } from '../../store.js';
import { formatDate } from '../../utils.js';

const RAIL_COLOR = {
  High:   'var(--danger)',
  Medium: 'oklch(0.62 0.16 60)',
  Low:    'transparent',
};

const PRIORITY_TONE = {
  High:   'overdue',
  Medium: 'today',
  Low:    'soon',
};

export function ApprovalCard({ task, isMobile = false }) {
  const [hover, setHover] = useState(false);
  const setSelectedApproval = useStore((s) => s.setSelectedApproval);

  const props = task.properties ?? {};
  const priority = props.priority || 'Medium';
  const requestor = props.principals?.find((p) => p.id === props.owner?.id);
  const requestorName = requestor?.displayName ?? requestor?.email ?? 'Unknown';

  if (isMobile) {
    return (
      <div
        onClick={() => setSelectedApproval(task)}
        style={{ position: 'relative', cursor: 'pointer', background: 'var(--surface)', paddingLeft: 4 }}
      >
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: RAIL_COLOR[priority] ?? 'transparent' }} />
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px 12px 16px', alignItems: 'flex-start' }}>
          <Avatar name={requestorName} size={28} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.005em', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {props.title || 'Untitled approval'}
            </span>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              Requested by <b style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{requestorName}</b>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
              {task.environmentName && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--ink-3)' }}>
                  <Icon n="flow" size={11} />
                  {task.environmentName}
                </span>
              )}
              <Pill tone={PRIORITY_TONE[priority] ?? 'neutral'}>{priority}</Pill>
              <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{formatDate(props.creationDate)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setSelectedApproval(task)}
      style={{
        position:   'relative',
        cursor:     'pointer',
        background: hover ? 'var(--surface-2)' : 'var(--surface)',
        paddingLeft:4,
        transition: 'background 100ms ease',
      }}
    >
      {/* Priority rail */}
      <span
        style={{
          position:   'absolute',
          left:       0,
          top:        0,
          bottom:     0,
          width:      4,
          background: RAIL_COLOR[priority] ?? 'transparent',
        }}
      />

      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '34px 1fr 200px 110px 100px',
          alignItems:          'center',
          gap:                 14,
          padding:             '14px 20px 14px 18px',
        }}
      >
        {/* Avatar */}
        <Avatar name={requestorName} size={28} />

        {/* Title block */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontWeight:    600,
              fontSize:      14.5,
              letterSpacing: '-0.005em',
              color:         'var(--ink)',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
              whiteSpace:    'nowrap',
            }}
          >
            {props.title || 'Untitled approval'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)', fontSize: 12 }}>
            <span>
              Requested by{' '}
              <b style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{requestorName}</b>
            </span>
          </div>
        </div>

        {/* Environment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)', fontSize: 12.5, minWidth: 0 }}>
          <Icon n="flow" size={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.environmentName}
          </span>
        </div>

        {/* Priority pill */}
        <div>
          <Pill tone={PRIORITY_TONE[priority] ?? 'neutral'}>{priority}</Pill>
        </div>

        {/* Creation date */}
        <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'right' }}>
          {formatDate(props.creationDate)}
        </div>
      </div>
    </div>
  );
}
