import { useMemo, useState } from 'react';
import { useIsMobile } from '../../utils.js';
import { useShallow } from 'zustand/react/shallow';
import { Icon } from '../common/Icon.jsx';
import { EmptyState } from '../common/EmptyState.jsx';
import { Spinner } from '../common/Spinner.jsx';
import { ApprovalCard } from './ApprovalCard.jsx';
import { useStore } from '../../store.js';

export function ApprovalsView() {
  const { approvalTasks, approvalsLoading } = useStore(
    useShallow((s) => ({
      approvalTasks:    s.approvalTasks,
      approvalsLoading: s.approvalsLoading,
    }))
  );

  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    let arr = [...approvalTasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((t) => {
        const props = t.properties ?? {};
        const requestor = props.principals?.find((p) => p.id === props.owner?.id);
        return (
          props.title?.toLowerCase().includes(q) ||
          t.environmentName?.toLowerCase().includes(q) ||
          requestor?.displayName?.toLowerCase().includes(q)
        );
      });
    }

    arr.sort((a, b) => {
      const ta = a.properties?.creationDate ? new Date(a.properties.creationDate).getTime() : 0;
      const tb = b.properties?.creationDate ? new Date(b.properties.creationDate).getTime() : 0;
      return tb - ta; // newest first
    });

    return arr;
  }, [approvalTasks, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Page header */}
      <div style={{ padding: isMobile ? '14px 16px 10px' : '20px 28px 14px', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, fontFamily: 'var(--mono)', marginBottom: 4 }}>
            Tasks
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Approvals
            </h1>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
              {list.length} pending
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            Power Automate approval requests waiting on your decision.
          </div>
        </div>
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
            placeholder="Filter by title, environment or requestor…"
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 13.5 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--ink-4)' }}>
              <Icon n="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: isMobile ? '0 16px 80px' : '0 28px 24px', overflow: 'auto' }}>
        {approvalsLoading && approvalTasks.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState view="approvals" />
        ) : (
          <div
            style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border)',
              borderRadius: 12,
              overflow:     'hidden',
            }}
          >
            {list.map((task, i) => (
              <div key={task.name} style={{ borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <ApprovalCard task={task} isMobile={isMobile} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
