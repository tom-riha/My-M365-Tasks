import { useMemo, useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Icon } from '../common/Icon.jsx';
import { useStore } from '../../store.js';
import { formatRelativeTime } from '../../utils.js';

const NAV_ITEMS = [
  { id: 'tasks',     label: 'Tasks',     icon: 'inbox' },
  { id: 'approvals', label: 'Approvals', icon: 'bell' },
];

const QUICK_LINKS = [
  { label: 'Planner',        icon: 'template',    href: 'https://tasks.office.com/' },
  { label: 'To Do',          icon: 'checkCircle', href: 'https://to-do.office.com/' },
  { label: 'Power Automate', icon: 'flow',        href: 'https://make.powerautomate.com/' },
];

// Power Automate's approvals list is environment-scoped — same URL shape as the
// per-task link built in ApprovalDetailPanel.jsx, minus the trailing task id.
function environmentHref(environmentId) {
  return `https://make.powerautomate.com/environments/${encodeURIComponent(environmentId)}/approvals/received`;
}

const REPO_URL = 'https://github.com/tom-riha/My-M365-Tasks';

export function Nav({ onRefresh }) {
  const { view, setView, todoTasks, plannerTasks, approvalTasks, environments, refreshing, lastRefreshed, isDemo } = useStore(
    useShallow((s) => ({
      view:          s.view,
      setView:       s.setView,
      todoTasks:     s.todoTasks,
      plannerTasks:  s.plannerTasks,
      approvalTasks: s.approvalTasks,
      environments:  s.environments,
      refreshing:    s.refreshing,
      lastRefreshed: s.lastRefreshed,
      isDemo:        s.isDemo,
    }))
  );

  // Re-render periodically so the relative "Xm ago" label stays current.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const counts = {
    tasks:     todoTasks.filter((t) => !t.fields.Complete).length + plannerTasks.filter((t) => !t.fields.Complete).length,
    approvals: approvalTasks.length,
  };

  const sortedEnvironments = useMemo(
    () => [...environments].sort((a, b) => a.name.localeCompare(b.name)),
    [environments]
  );

  return (
    <aside
      style={{
        width:         240,
        flexShrink:    0,
        background:    'var(--surface)',
        borderRight:   '1px solid var(--border)',
        padding:       '14px 10px',
        display:       'flex',
        flexDirection: 'column',
        gap:           18,
        overflowY:     'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            count={counts[item.id]}
            active={view === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
      </div>

      {/* Quick links to the native Microsoft apps. Environments nest under Power
          Automate — it has no single cross-environment approvals URL, so each
          one gets its own link straight to that environment's approvals list. */}
      <NavSection label="Quick links">
        {QUICK_LINKS.map((link) => (
          <QuickLink key={link.label} {...link} />
        ))}
        {sortedEnvironments.map((env) => (
          <QuickLink key={env.id} label={env.name} href={environmentHref(env.id)} indent />
        ))}
      </NavSection>

      {/* Footer */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {isDemo ? (
          <div style={{ padding: '7px 10px 4px', fontSize: 11.5, color: 'var(--ink-4)' }}>
            🎭 Demo data — nothing to refresh
          </div>
        ) : (
          <>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh data"
              style={{
                width:       '100%',
                display:     'flex',
                alignItems:  'center',
                gap:         8,
                padding:     '7px 10px',
                borderRadius:7,
                textAlign:   'left',
                color:       'var(--ink-2)',
                fontWeight:  500,
                fontSize:    13.5,
                opacity:     refreshing ? 0.6 : 1,
                cursor:      refreshing ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!refreshing) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon n="refresh" size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            {lastRefreshed && (
              <div style={{ padding: '0 9px 4px', fontSize: 11.5, color: 'var(--ink-4)' }}>
                Updated {formatRelativeTime(lastRefreshed)}
              </div>
            )}
          </>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 8px' }} />

        <div style={{ padding: '2px 9px 4px', fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.5 }}>
          100% client-side — nothing leaves your browser except calls to Microsoft.{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-3)', textDecoration: 'underline' }}>
            Open source ↗
          </a>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label, children }) {
  return (
    <div>
      <div
        style={{
          fontSize:      10.5,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color:         'var(--ink-4)',
          fontWeight:    600,
          padding:       '0 10px 6px',
          fontFamily:    'var(--mono)',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</div>
    </div>
  );
}

function NavItem({ item, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        width:       '100%',
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '7px 10px',
        borderRadius:7,
        textAlign:   'left',
        background:  active ? 'var(--accent-soft)' : 'transparent',
        color:       active ? 'var(--accent-ink)' : 'var(--ink-2)',
        fontWeight:  active ? 600 : 500,
        position:    'relative',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {active && (
        <span
          style={{
            position:     'absolute',
            left:         0,
            top:          6,
            bottom:       6,
            width:        3,
            background:   'var(--accent)',
            borderRadius: '0 3px 3px 0',
          }}
        />
      )}
      <Icon n={item.icon} size={15} />
      <span style={{ flex: 1, fontSize: 13.5 }}>{item.label}</span>
      {count != null && (
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize:           11.5,
            fontWeight:         500,
            color:              active ? 'var(--accent)' : 'var(--ink-3)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function QuickLink({ label, icon, href, indent = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        width:       '100%',
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     indent ? '6px 10px 6px 34px' : '7px 10px',
        borderRadius:7,
        color:       indent ? 'var(--ink-3)' : 'var(--ink-2)',
        fontWeight:  500,
        fontSize:    indent ? 12.5 : 13.5,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon && <Icon n={icon} size={15} />}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <Icon n="arrowRight" size={11} style={{ color: 'var(--ink-4)', transform: 'rotate(-45deg)', flexShrink: 0 }} />
    </a>
  );
}
