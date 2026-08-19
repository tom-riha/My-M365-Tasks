import { useEffect, useState } from 'react';
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MSAL_CONFIG } from './config.js';
import { useStore } from './store.js';
import { Icon } from './components/common/Icon.jsx';
import { Header } from './components/layout/Header.jsx';
import { Nav } from './components/layout/Nav.jsx';
import { MobileBottomNav } from './components/layout/MobileBottomNav.jsx';
import { TaskView } from './components/tasks/TaskView.jsx';
import { TaskDetailPanel } from './components/tasks/TaskDetailPanel.jsx';
import { ApprovalsView } from './components/approvals/ApprovalsView.jsx';
import { ApprovalDetailPanel } from './components/approvals/ApprovalDetailPanel.jsx';
import { Toaster } from './components/common/Toaster.jsx';
import { Spinner } from './components/common/Spinner.jsx';
import { DemoBanner } from './components/common/DemoBanner.jsx';
import { fetchAllApprovalTasks } from './api/approvals.js';
import { fetchAllTodoTasks } from './api/todo.js';
import { fetchAllPlannerTasks } from './api/planner.js';
import { startDemo } from './api/demo.js';
import { useIsMobile } from './utils.js';

const msalInstance = new PublicClientApplication(MSAL_CONFIG);

// ─── Deep-link support ───────────────────────────────────────────────────────
// Expected format: ?environmentId=<env-id>&taskId=<approval-id> — links straight
// to a single pending approval, e.g. from an email or Teams notification.

function getDeeplinkParams() {
  const params = new URLSearchParams(location.search);
  const environmentId = params.get('environmentId');
  const taskId = params.get('taskId');
  return environmentId && taskId ? { environmentId, taskId } : null;
}

export default function App() {
  // Demo mode bypasses MSAL entirely — once started it's just AppShell reading
  // fixture data out of the store, no active account required.
  const isDemo = useStore((s) => s.isDemo);

  return (
    <MsalProvider instance={msalInstance}>
      {isDemo ? (
        <AppShell />
      ) : (
        <>
          <AuthenticatedTemplate>
            <AppShell />
          </AuthenticatedTemplate>
          <UnauthenticatedTemplate>
            <SignInScreen />
          </UnauthenticatedTemplate>
        </>
      )}
    </MsalProvider>
  );
}

// ─── Permissions disclaimer ───────────────────────────────────────────────────
// What this app asks Microsoft for, and why — shown on the sign-in screen since
// that's when the consent prompt actually happens. Dismissible like the original
// app's privacy notice, but under its own localStorage key so everyone sees the
// updated permission list (Tasks.ReadWrite is new) at least once.

const PERMISSIONS = [
  { service: 'Graph',        permission: 'openid',                type: 'Delegated', purpose: 'Authentication' },
  { service: 'Graph',        permission: 'profile',                type: 'Delegated', purpose: 'User profile' },
  { service: 'Graph',        permission: 'Tasks.ReadWrite',        type: 'Delegated', purpose: 'Read and complete your Planner and To Do tasks' },
  { service: 'Flow Service', permission: 'Flows.Read.All',         type: 'Delegated', purpose: 'List environments' },
  { service: 'Flow Service', permission: 'Approvals.Read.All',     type: 'Delegated', purpose: 'Read approval tasks' },
  { service: 'Flow Service', permission: 'Approvals.Manage.All',   type: 'Delegated', purpose: 'Respond to approvals' },
];

function PermissionsNotice() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('permissionsNoticeDismissed') === 'true'
  );

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem('permissionsNoticeDismissed', 'true');
    setDismissed(true);
  }

  const cellStyle = { padding: '4px 10px 4px 0', textAlign: 'left' };

  return (
    <div style={{
      position:     'relative',
      background:   'var(--info-soft)',
      border:       '1px solid oklch(0.89 0.06 230)',
      borderRadius: 12,
      padding:      '14px 16px',
      maxWidth:     420,
      width:        '100%',
      marginTop:    16,
      textAlign:    'left',
    }}>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ position: 'absolute', top: 10, right: 10, padding: 4, borderRadius: 6, color: 'var(--info)', opacity: 0.7 }}
      >
        <Icon n="x" size={14} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Icon n="info" size={16} style={{ color: 'var(--info)', marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--ink)' }}>Privacy notice</p>
          <p style={{ margin: '0 0 4px' }}>
            This app uses Microsoft's secure sign-in. All authentication and data requests go directly between you and Microsoft — this page never sees your password and doesn't collect, store, or transmit any personal data.
          </p>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--ink)' }}>Requested permissions</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.85 0.07 230)' }}>
                  <th style={cellStyle}>Service</th>
                  <th style={cellStyle}>Permission</th>
                  <th style={cellStyle}>Type</th>
                  <th style={{ ...cellStyle, paddingRight: 0 }}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => (
                  <tr key={p.permission} style={{ borderBottom: '1px solid oklch(0.92 0.03 230)' }}>
                    <td style={cellStyle}>{p.service}</td>
                    <td style={{ ...cellStyle, fontFamily: 'var(--mono)' }}>{p.permission}</td>
                    <td style={cellStyle}>{p.type}</td>
                    <td style={{ ...cellStyle, paddingRight: 0 }}>{p.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sign-in screen ───────────────────────────────────────────────────────────

function SignInScreen() {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const [deeplink] = useState(getDeeplinkParams);

  async function handleSignIn() {
    setLoading(true);
    try {
      await instance.loginPopup({ scopes: ['https://graph.microsoft.com/.default'] });
    } catch (err) {
      console.error('Sign-in error:', err);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--bg)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        16,
    }}>
      <div style={{
        background:   'var(--surface)',
        border:       '1px solid var(--border)',
        borderRadius: 16,
        padding:      '40px 36px',
        maxWidth:     420,
        width:        '100%',
        textAlign:    'center',
        boxShadow:    '0 8px 32px oklch(0 0 0 / 0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <img src="/assets/black_transparent.svg" alt="" width={48} height={48} style={{ flexShrink: 0 }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
            My M365 Tasks
          </h1>
        </div>

        <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 20px' }}>
          Sign in with your Microsoft 365 account to see your Planner tasks, To Do tasks, and Power Automate approvals in one place.
        </p>

        {deeplink && (
          <p style={{
            fontSize: 12.5, color: 'var(--accent-ink)', background: 'var(--accent-soft)',
            border: '1px solid var(--accent-edge)', borderRadius: 8, padding: '8px 12px', margin: '0 0 20px',
          }}>
            Sign in to open the linked approval task.
          </p>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            8,
            padding:        '11px 20px',
            borderRadius:   8,
            background:     'var(--accent)',
            color:          'white',
            fontWeight:     600,
            fontSize:       14,
            width:          '100%',
            justifyContent: 'center',
            opacity:        loading ? 0.7 : 1,
            boxShadow:      '0 1px 0 oklch(0.35 0.15 264 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.15)',
          }}
        >
          {loading ? <Spinner size="sm" /> : <Icon n="user" size={16} />}
          {loading ? 'Signing in…' : 'Sign in with Microsoft'}
        </button>

        <button
          onClick={startDemo}
          style={{
            marginTop:      10,
            width:          '100%',
            padding:        '10px 20px',
            borderRadius:   8,
            background:     'transparent',
            border:         '1px solid var(--border-strong)',
            color:          'var(--ink-2)',
            fontWeight:     600,
            fontSize:       14,
          }}
        >
          Try the demo
        </button>
        <p style={{ fontSize: 11.5, color: 'var(--ink-4)', margin: '8px 0 0' }}>
          No sign-in — loads example tasks and approvals that live only in this browser tab.
        </p>
      </div>

      <PermissionsNotice />
    </div>
  );
}

// ─── Authenticated app shell ──────────────────────────────────────────────────

function AppShell() {
  const { instance, accounts } = useMsal();
  const store = useStore();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deeplink] = useState(getDeeplinkParams);

  useEffect(() => {
    // Demo mode already has everything it needs — startDemo() seeded currentUser
    // and all three task arrays synchronously, with no MSAL account involved.
    if (store.isDemo) return;

    if (!instance.getActiveAccount() && accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
    }
    const account = instance.getActiveAccount();
    store.setCurrentUser({ name: account?.name ?? '', email: account?.username ?? '' });

    // No shared primary data source anymore (no SharePoint site to resolve first),
    // so all three sources load in parallel from the start.
    Promise.all([loadTodoTasks(), loadPlannerTasks(), loadApprovals()]).then(() => {
      store.setData('lastRefreshed', Date.now());
      if (deeplink) openDeeplinkedApproval();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openDeeplinkedApproval() {
    const { approvalTasks, addToast, setView, setSelectedApproval } = useStore.getState();
    const task = approvalTasks.find(
      (t) => t.name === deeplink.taskId && t.environmentId === deeplink.environmentId
    );
    if (task) {
      // setView() resets selectedApproval to null, so it must run first —
      // this also means closing the panel lands the user on the Approvals tab.
      setView('approvals');
      setSelectedApproval(task);
    } else {
      addToast('The linked approval task was not found or has already been completed.', 'warning');
    }
  }

  // Re-runs all loads from scratch (ignoring the *Loaded flags) and stamps
  // lastRefreshed once everything settles.
  async function refreshAll() {
    if (store.refreshing || store.isDemo) return; // nothing to refresh — demo data is static for the session
    store.setData('refreshing', true);
    store.setData('approvalsLoaded', false);
    store.setData('todoLoaded', false);
    store.setData('plannerLoaded', false);
    try {
      await Promise.all([loadTodoTasks(), loadPlannerTasks(), loadApprovals()]);
    } finally {
      store.setData('lastRefreshed', Date.now());
      store.setData('refreshing', false);
    }
  }

  // Loaded independently — kept separate so a slow or failing Power Automate
  // call (different token/scope) never blocks the task UI, and vice versa.
  async function loadApprovals() {
    const s = useStore.getState();
    if (s.approvalsLoaded || s.approvalsLoading) return;
    store.setData('approvalsLoading', true);
    try {
      const { tasks, environments } = await fetchAllApprovalTasks(instance);
      store.setData('approvalTasks', tasks);
      store.setData('environments', environments);
      store.setData('approvalsLoaded', true);
    } catch (err) {
      console.error('Approvals load error:', err);
      store.addToast(`Failed to load approvals: ${err.message}`, 'error');
    } finally {
      store.setData('approvalsLoading', false);
    }
  }

  async function loadTodoTasks() {
    const s = useStore.getState();
    if (s.todoLoaded || s.todoLoading) return;
    store.setData('todoLoading', true);
    try {
      const todoTasks = await fetchAllTodoTasks(instance, useStore.getState().currentUser);
      store.setData('todoTasks', todoTasks);
      store.setData('todoLoaded', true);
    } catch (err) {
      console.error('To Do load error:', err);
      store.addToast(`Failed to load Microsoft To Do tasks: ${err.message}`, 'error');
    } finally {
      store.setData('todoLoading', false);
    }
  }

  async function loadPlannerTasks() {
    const s = useStore.getState();
    if (s.plannerLoaded || s.plannerLoading) return;
    store.setData('plannerLoading', true);
    try {
      const plannerTasks = await fetchAllPlannerTasks(instance, useStore.getState().currentUser);
      store.setData('plannerTasks', plannerTasks);
      store.setData('plannerLoaded', true);
    } catch (err) {
      console.error('Planner load error:', err);
      store.addToast(`Failed to load Microsoft Planner tasks: ${err.message}`, 'error');
    } finally {
      store.setData('plannerLoading', false);
    }
  }

  const { view, selectedTask, selectedApproval, todoLoading, plannerLoading, todoTasks, plannerTasks } = store;
  const initialLoading = (todoLoading || plannerLoading) && todoTasks.length === 0 && plannerTasks.length === 0;

  const mainContent = initialLoading ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, color: 'var(--ink-3)' }}>
      <Spinner size="lg" />
      <p style={{ fontSize: 13, margin: 0 }}>Loading your tasks…</p>
    </div>
  ) : view === 'approvals' ? (
    <ApprovalsView />
  ) : (
    <TaskView />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {store.isDemo && <DemoBanner />}
      <Header
        isMobile={isMobile}
        onMenu={() => setDrawerOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Desktop sidebar */}
        {!isMobile && <Nav onRefresh={refreshAll} />}

        {/* Mobile drawer overlay */}
        {isMobile && drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 45,
                background: 'oklch(0.15 0.01 260 / 0.3)',
                animation: 'fadeIn 140ms ease',
              }}
            />
            <div style={{
              position:   'fixed',
              top:        0,
              left:       0,
              bottom:     0,
              width:      260,
              zIndex:     46,
              background: 'var(--surface)',
              borderRight:'1px solid var(--border)',
              boxShadow:  '8px 0 24px oklch(0 0 0 / 0.08)',
              animation:  'slideInLeft 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}>
              <Nav onRefresh={refreshAll} />
            </div>
          </>
        )}

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          {mainContent}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileBottomNav
          activeView={view}
          setActiveView={store.setView}
        />
      )}

      {/* Detail side panels */}
      {selectedTask && <TaskDetailPanel task={selectedTask} />}
      {selectedApproval && <ApprovalDetailPanel task={selectedApproval} />}

      <Toaster />
    </div>
  );
}
