import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useShallow } from 'zustand/react/shallow';
import { Icon } from '../common/Icon.jsx';
import { Pill } from '../common/Pill.jsx';
import { Spinner } from '../common/Spinner.jsx';
import { useStore } from '../../store.js';
import { dueInfo, formatDate } from '../../utils.js';
import { completeTodoTask, fetchAllTodoTasks } from '../../api/todo.js';
import { completePlannerTask, fetchAllPlannerTasks, fetchPlannerTaskDetails, setChecklistItemChecked } from '../../api/planner.js';
import { completeDemoTask, toggleDemoChecklistItem } from '../../api/demo.js';

const FIELD_LABEL = { fontSize: 12, color: 'var(--ink-3)', paddingTop: 3 };

export function TaskDetailPanel({ task }) {
  const { instance } = useMsal();
  const { setSelectedTask, setData, addToast, currentUser, isDemo } = useStore(
    useShallow((s) => ({
      setSelectedTask: s.setSelectedTask,
      setData:         s.setData,
      addToast:        s.addToast,
      currentUser:     s.currentUser,
      isDemo:          s.isDemo,
    }))
  );

  const [completing, setCompleting] = useState(false);
  const [details, setDetails]       = useState(null); // { description, checklist } — Planner only, lazy-loaded
  const [loadingDetails, setLoadingDetails] = useState(false);

  const f = task.fields;
  const due = dueInfo(task);
  const isTodo = task.source === 'todo';

  const closePanel = () => setSelectedTask(null);

  useEffect(() => {
    if (isTodo) return; // To Do already carries its description in fields.Description
    if (isDemo) {
      // Demo data already has everything on the task object — nothing to fetch.
      setDetails({ description: f.Description, checklist: task.demoChecklist ?? [] });
      return;
    }
    let cancelled = false;
    setLoadingDetails(true);
    fetchPlannerTaskDetails(instance, task.plannerTaskId)
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch((err) => { if (!cancelled) addToast(`Failed to load task details: ${err.message}`, 'error'); })
      .finally(() => { if (!cancelled) setLoadingDetails(false); });
    return () => { cancelled = true; };
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleComplete() {
    setCompleting(true);
    try {
      if (isDemo) {
        completeDemoTask(task);
      } else if (isTodo) {
        await completeTodoTask(instance, task.todoListId, task.todoTaskId);
        const newTodoTasks = await fetchAllTodoTasks(instance, currentUser);
        setData('todoTasks', newTodoTasks);
      } else {
        await completePlannerTask(instance, task.plannerTaskId);
        const newPlannerTasks = await fetchAllPlannerTasks(instance, currentUser);
        setData('plannerTasks', newPlannerTasks);
      }
      addToast('Task completed!', 'success');
      closePanel();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCompleting(false);
    }
  }

  async function handleToggleChecklistItem(itemId, isChecked) {
    setDetails((d) => ({
      ...d,
      checklist: d.checklist.map((i) => (i.id === itemId ? { ...i, isChecked } : i)),
    }));
    if (isDemo) {
      toggleDemoChecklistItem(task, itemId, isChecked); // persists so reopening the panel keeps the change
      return;
    }
    try {
      await setChecklistItemChecked(instance, task.plannerTaskId, itemId, isChecked);
    } catch (err) {
      addToast(err.message, 'error');
      // Revert on failure
      setDetails((d) => ({
        ...d,
        checklist: d.checklist.map((i) => (i.id === itemId ? { ...i, isChecked: !isChecked } : i)),
      }));
    }
  }

  const description = isTodo ? f.Description : details?.description;
  const checklist    = isTodo ? null : details?.checklist;

  const linkStyle = {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           6,
    color:         'var(--accent-ink)',
    fontWeight:    500,
    borderBottom:  '1px solid var(--accent-edge)',
    paddingBottom: 1,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closePanel}
        style={{
          position:  'fixed',
          inset:     0,
          background:'oklch(0.15 0.01 260 / 0.18)',
          zIndex:    30,
          animation: 'fadeIn 140ms ease',
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position:      'fixed',
          top:           0,
          right:         0,
          bottom:        0,
          width:         520,
          maxWidth:      '100vw',
          zIndex:        31,
          background:    'var(--surface)',
          borderLeft:    '1px solid var(--border)',
          boxShadow:     '-20px 0 50px oklch(0 0 0 / 0.08)',
          display:       'flex',
          flexDirection: 'column',
          animation:     'slideIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding:      '14px 22px',
            borderBottom: '1px solid var(--border)',
            display:      'flex',
            alignItems:   'center',
            gap:          10,
          }}
        >
          <Pill tone="neutral" icon="flow">{isTodo ? 'Microsoft To Do' : 'Microsoft Planner'}</Pill>
          <div style={{ flex: 1 }} />
          <button onClick={closePanel} style={{ padding: 6, borderRadius: 6, color: 'var(--ink-3)' }}>
            <Icon n="x" size={16} />
          </button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, padding: '20px 24px 0', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <h2
            style={{
              margin:        0,
              fontSize:      22,
              fontWeight:    600,
              letterSpacing: '-0.02em',
              lineHeight:    1.25,
              textWrap:      'pretty',
              textDecoration: f.Complete ? 'line-through' : 'none',
              color:          f.Complete ? 'var(--ink-3)' : 'var(--ink)',
            }}
          >
            {f.Title}
          </h2>

          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 10, columnGap: 14, fontSize: 13 }}>
            {f.SourceLabel && (
              <>
                <div style={FIELD_LABEL}>{isTodo ? 'List' : 'Plan'}</div>
                <div>{f.SourceLabel}</div>
              </>
            )}

            <div style={FIELD_LABEL}>Due</div>
            <div>{due ? due.label : 'No due date'}</div>

            {f.Created && (
              <>
                <div style={FIELD_LABEL}>Created</div>
                <div>{formatDate(f.Created)}</div>
              </>
            )}

            {f.Complete && f.CompletionDate && (
              <>
                <div style={FIELD_LABEL}>Completed</div>
                <div>{formatDate(f.CompletionDate)}</div>
              </>
            )}
          </div>

          {/* Description */}
          {loadingDetails ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <Spinner size="sm" />
            </div>
          ) : description ? (
            <div>
              <div style={{ ...FIELD_LABEL, paddingTop: 0, marginBottom: 6 }}>Description</div>
              <div style={{ color: 'var(--ink-2)', lineHeight: 1.55, textWrap: 'pretty', whiteSpace: 'pre-wrap' }}>
                {description}
              </div>
            </div>
          ) : null}

          {/* Checklist — Planner only */}
          {checklist && checklist.length > 0 && (
            <div>
              <div style={{ ...FIELD_LABEL, paddingTop: 0, marginBottom: 6 }}>
                Checklist ({checklist.filter((i) => i.isChecked).length}/{checklist.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer', padding: '4px 0' }}
                  >
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ color: item.isChecked ? 'var(--ink-3)' : 'var(--ink)', textDecoration: item.isChecked ? 'line-through' : 'none' }}>
                      {item.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!isTodo && (
            <a
              href="https://tasks.office.com/"
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              <Icon n="arrowRight" size={12} />
              Open Microsoft Planner
            </a>
          )}
          {isTodo && (
            <a
              href="https://to-do.office.com/"
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              <Icon n="arrowRight" size={12} />
              Open Microsoft To Do
            </a>
          )}

          <div style={{ height: 24 }} />
        </div>

        {/* Panel footer */}
        {!f.Complete && (
          <div
            style={{
              padding:    '12px 22px',
              borderTop:  '1px solid var(--border)',
              display:    'flex',
              gap:        8,
              background: 'var(--surface-2)',
            }}
          >
            <div style={{ flex: 1 }} />
            <button
              onClick={handleComplete}
              disabled={completing}
              style={{
                padding:     '9px 14px',
                borderRadius:8,
                background:  'var(--ok)',
                color:       'white',
                fontWeight:  600,
                fontSize:    13.5,
                display:     'inline-flex',
                alignItems:  'center',
                gap:         6,
                boxShadow:   '0 1px 0 oklch(0.35 0.12 152 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.15)',
                opacity:     completing ? 0.6 : 1,
              }}
            >
              <Icon n="check" size={14} />
              {completing ? 'Completing…' : 'Mark complete'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
