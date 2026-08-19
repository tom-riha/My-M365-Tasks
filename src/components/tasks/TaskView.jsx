import { useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useShallow } from 'zustand/react/shallow';
import { Icon } from '../common/Icon.jsx';
import { Pill } from '../common/Pill.jsx';
import { EmptyState } from '../common/EmptyState.jsx';
import { Spinner } from '../common/Spinner.jsx';
import { TaskCard } from './TaskCard.jsx';
import { useStore } from '../../store.js';
import { dueInfo, useIsMobile } from '../../utils.js';
import { completeTodoTask, fetchAllTodoTasks } from '../../api/todo.js';
import { completePlannerTask, fetchAllPlannerTasks } from '../../api/planner.js';
import { completeDemoTask } from '../../api/demo.js';

export function TaskView() {
  const { instance } = useMsal();
  const {
    todoTasks, plannerTasks, currentUser,
    search, setSearch, showTodoTasks, showPlannerTasks,
    setData, todoLoading, plannerLoading, addToast, isDemo,
  } = useStore(
    useShallow((s) => ({
      todoTasks:        s.todoTasks,
      plannerTasks:     s.plannerTasks,
      currentUser:      s.currentUser,
      search:           s.search,
      setSearch:        s.setSearch,
      showTodoTasks:    s.showTodoTasks,
      showPlannerTasks: s.showPlannerTasks,
      setData:          s.setData,
      todoLoading:      s.todoLoading,
      plannerLoading:   s.plannerLoading,
      addToast:         s.addToast,
      isDemo:           s.isDemo,
    }))
  );

  const isMobile = useIsMobile();
  const [completingId, setCompletingId] = useState(null);

  const loading = todoLoading || plannerLoading;

  // Flat filtered + sorted list. No completed-tasks view: api/planner.js and
  // api/todo.js only ever fetch open tasks in the first place, so there'd be
  // nothing to show there.
  const list = useMemo(() => {
    let arr = [
      ...(showTodoTasks ? todoTasks : []),
      ...(showPlannerTasks ? plannerTasks : []),
    ];

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((t) => t.fields.Title?.toLowerCase().includes(q));
    }

    // Soonest due date first; tasks with no due date go to the bottom
    arr.sort((a, b) => {
      const ta = a.fields.DueDate ? new Date(a.fields.DueDate).getTime() : Infinity;
      const tb = b.fields.DueDate ? new Date(b.fields.DueDate).getTime() : Infinity;
      return ta - tb;
    });

    return arr;
  }, [todoTasks, plannerTasks, showTodoTasks, showPlannerTasks, search]);

  // Group by urgency
  const groups = useMemo(() => {
    const b = { overdue: [], today: [], soon: [], future: [] };
    list.forEach((t) => {
      const { kind } = dueInfo(t) ?? { kind: 'future' };
      (b[kind] ?? b.future).push(t);
    });
    return [
      { key: 'overdue',  label: 'Overdue',    tone: 'overdue', items: b.overdue },
      { key: 'today',    label: 'Due today',  tone: 'today',   items: b.today },
      { key: 'soon',     label: 'This week',  tone: 'soon',    items: b.soon },
      { key: 'future',   label: 'Later',      tone: 'future',  items: b.future },
    ].filter((g) => g.items.length > 0);
  }, [list]);

  async function handleComplete(task) {
    const taskId = task.id;
    setCompletingId(taskId);
    try {
      if (isDemo) {
        completeDemoTask(task);
      } else if (task.source === 'todo') {
        await completeTodoTask(instance, task.todoListId, task.todoTaskId);
        const newTodoTasks = await fetchAllTodoTasks(instance, currentUser);
        setData('todoTasks', newTodoTasks);
      } else {
        await completePlannerTask(instance, task.plannerTaskId);
        const newPlannerTasks = await fetchAllPlannerTasks(instance, currentUser);
        setData('plannerTasks', newPlannerTasks);
      }
      addToast('Task completed!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Page header */}
      <div style={{ padding: isMobile ? '14px 16px 10px' : '20px 28px 14px' }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, fontFamily: 'var(--mono)', marginBottom: 4 }}>
          Tasks
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Open
          </h1>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
            {list.length} tasks
          </span>
        </div>
        {!isMobile && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            Planner and To Do tasks waiting on you, ordered by what matters now.
          </div>
        )}
      </div>

      {/* Filter strip */}
      <div style={{ padding: isMobile ? '8px 16px' : '12px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
            background: 'var(--surface)',
            border:     '1px solid var(--border)',
            borderRadius:8,
            padding:    '7px 10px',
            flex:       '1 1 320px',
            maxWidth:   380,
          }}
        >
          <Icon n="search" size={14} style={{ color: 'var(--ink-4)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title…"
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 13.5 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--ink-4)' }}>
              <Icon n="x" size={14} />
            </button>
          )}
        </div>

        {(todoTasks.length > 0 || plannerTasks.length > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {todoTasks.length > 0 && (
              <SourceToggle
                label="To Do"
                checked={showTodoTasks}
                onChange={(v) => setData('showTodoTasks', v)}
              />
            )}
            {plannerTasks.length > 0 && (
              <SourceToggle
                label="Planner"
                checked={showPlannerTasks}
                onChange={(v) => setData('showPlannerTasks', v)}
              />
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: isMobile ? '0 16px 80px' : '0 28px 24px', overflow: 'auto' }}>
        {loading && todoTasks.length === 0 && plannerTasks.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState view="open" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {groups.map((g) => (
              <div key={g.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 8px' }}>
                  <Pill tone={g.tone}>{g.label}</Pill>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {g.items.length}
                  </span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <div
                  style={{
                    background:   'var(--surface)',
                    border:       '1px solid var(--border)',
                    borderRadius: 12,
                    overflow:     'hidden',
                  }}
                >
                  {g.items.map((task, i) => (
                    <div key={task.id} style={{ borderBottom: i < g.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <TaskCard
                        task={task}
                        onComplete={handleComplete}
                        completing={completingId === task.id}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceToggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer', userSelect: 'none' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}
