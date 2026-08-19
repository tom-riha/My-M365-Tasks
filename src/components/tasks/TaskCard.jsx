import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Icon } from '../common/Icon.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Pill } from '../common/Pill.jsx';
import { useStore } from '../../store.js';
import { dueInfo } from '../../utils.js';

const RAIL_COLOR = {
  overdue: 'var(--danger)',
  today:   'oklch(0.62 0.16 60)',
  soon:    'oklch(0.78 0.06 230)',
  future:  'transparent',
  done:    'var(--ok)',
};

export function TaskCard({ task, onComplete, completing, isMobile = false }) {
  const [hover, setHover] = useState(false);
  const { currentUser, setSelectedTask } = useStore(
    useShallow((s) => ({
      currentUser:     s.currentUser,
      setSelectedTask: s.setSelectedTask,
    }))
  );

  const f  = task.fields;
  const due = dueInfo(task);
  const isTodo    = task.source === 'todo';
  const canComplete = !f.Complete;

  if (isMobile) {
    return (
      <div
        onClick={() => setSelectedTask(task)}
        style={{ position: 'relative', cursor: 'pointer', background: 'var(--surface)', paddingLeft: 4 }}
      >
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: RAIL_COLOR[due?.kind] ?? 'transparent',
        }} />
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px 12px 16px', alignItems: 'flex-start' }}>
          <div style={{ paddingTop: 2, flexShrink: 0 }}>
            {f.Complete ? (
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ok)', color: 'white', display: 'grid', placeItems: 'center' }}>
                <Icon n="check" size={11} />
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); if (canComplete) onComplete(task); }}
                disabled={!canComplete || completing}
                title="Mark complete"
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--ink-3)', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.005em', color: f.Complete ? 'var(--ink-3)' : 'var(--ink)', textDecoration: f.Complete ? 'line-through' : 'none' }}>
              {f.Title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{isTodo ? 'Microsoft To Do' : 'Microsoft Planner'}</span>
              {due && <Pill tone={due.kind} icon={due.kind === 'overdue' ? 'alert' : 'calendar'}>{due.label}</Pill>}
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
      onClick={() => setSelectedTask(task)}
      style={{
        position:   'relative',
        cursor:     'pointer',
        background: hover ? 'var(--surface-2)' : 'var(--surface)',
        paddingLeft:4,
        transition: 'background 100ms ease',
      }}
    >
      {/* Urgency rail */}
      <span
        style={{
          position:   'absolute',
          left:       0,
          top:        0,
          bottom:     0,
          width:      4,
          background: RAIL_COLOR[due.kind] ?? 'transparent',
        }}
      />

      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '24px 1fr 200px 110px 36px',
          alignItems: 'center',
          gap:        14,
          padding:    '14px 20px 14px 18px',
        }}
      >
        {/* Complete button */}
        {f.Complete ? (
          <span
            style={{
              width:       20,
              height:      20,
              borderRadius:'50%',
              background:  'var(--ok)',
              color:       'white',
              display:     'grid',
              placeItems:  'center',
            }}
          >
            <Icon n="check" size={11} />
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); if (canComplete) onComplete(task); }}
            disabled={!canComplete || completing}
            title="Mark complete"
            style={{
              width:       20,
              height:      20,
              borderRadius:'50%',
              border:      '1.5px solid var(--ink-3)',
              background:  'transparent',
              cursor:      'pointer',
              flexShrink:  0,
            }}
          />
        )}

        {/* Title block */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontWeight:     600,
              fontSize:       14.5,
              letterSpacing:  '-0.005em',
              color:          f.Complete ? 'var(--ink-3)' : 'var(--ink)',
              textDecoration: f.Complete ? 'line-through' : 'none',
            }}
          >
            {f.Title}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)', fontSize: 12 }}>
            <span>
              {isTodo ? 'Microsoft To Do' : 'Microsoft Planner'}
              {f.SourceLabel && (
                <>
                  {' · '}
                  <b style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{f.SourceLabel}</b>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Owner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-2)', fontSize: 12.5, minWidth: 0 }}>
          <Avatar name={currentUser.name} size={22} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>You</span>
        </div>

        {/* Due date pill */}
        <div>
          {due && (
            <Pill tone={due.kind} icon={due.kind === 'overdue' ? 'alert' : 'calendar'}>
              {due.label}
            </Pill>
          )}
        </div>

        {/* Overflow */}
        <button
          onClick={(e) => e.stopPropagation()}
          style={{ color: 'var(--ink-4)', opacity: hover ? 1 : 0, padding: 4, borderRadius: 6, transition: 'opacity 100ms' }}
        >
          <Icon n="dots" size={16} />
        </button>
      </div>
    </div>
  );
}
