import { useStore } from '../store.js';

// ─── Demo mode ─────────────────────────────────────────────────────────────────
// Fixture data + the handful of "mutating" actions demo mode needs, normalized
// into the exact same shapes api/planner.js, api/todo.js, and api/approvals.js
// produce. Every other component (TaskView, TaskCard, both detail panels,
// ApprovalsView, Nav…) renders this identically to real data — it has no idea
// demo mode exists. Nothing here ever calls the network; state lives only in
// the browser's memory for the session (see store.js's `isDemo` flag).

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export const demoCurrentUser = { name: 'Alex Demo', email: 'alex.demo@example.com' };

export const demoTodoTasks = [
  {
    id: 'demo:todo:1', source: 'todo', todoListId: 'demo-list-work', todoTaskId: 'demo-task-1',
    fields: {
      Title: 'Review Q3 budget spreadsheet', Complete: false,
      DueDate: inDays(-1), CompletionDate: null, CompletedByLookupId: null, CompletedByLookupValue: '',
      Created: inDays(-5), Description: "Double-check the marketing line items before Friday's review.",
      SourceLabel: 'Work',
    },
  },
  {
    id: 'demo:todo:2', source: 'todo', todoListId: 'demo-list-work', todoTaskId: 'demo-task-2',
    fields: {
      Title: 'Send onboarding doc to new hire', Complete: false,
      DueDate: inDays(0), CompletionDate: null, CompletedByLookupId: null, CompletedByLookupValue: '',
      Created: inDays(-2), Description: '', SourceLabel: 'Work',
    },
  },
  {
    id: 'demo:todo:3', source: 'todo', todoListId: 'demo-list-personal', todoTaskId: 'demo-task-3',
    fields: {
      Title: 'Book flights for offsite', Complete: false,
      DueDate: inDays(4), CompletionDate: null, CompletedByLookupId: null, CompletedByLookupValue: '',
      Created: inDays(-1), Description: '', SourceLabel: 'Personal',
    },
  },
];

export const demoPlannerTasks = [
  {
    id: 'demo:planner:1', source: 'planner', plannerTaskId: 'demo-plan-task-1',
    fields: {
      Title: 'Prepare launch checklist', Complete: false,
      DueDate: inDays(2), CompletionDate: null, CompletedByLookupId: null, CompletedByLookupValue: '',
      Created: inDays(-3), Description: 'Confirm every workstream has signed off before we flip the switch.',
      SourceLabel: 'Product Launch',
    },
    demoChecklist: [
      { id: 'c1', title: 'Engineering sign-off', isChecked: true, orderHint: '1' },
      { id: 'c2', title: 'Marketing assets approved', isChecked: true, orderHint: '2' },
      { id: 'c3', title: 'Support team briefed', isChecked: false, orderHint: '3' },
      { id: 'c4', title: 'Rollback plan documented', isChecked: false, orderHint: '4' },
    ],
  },
  {
    id: 'demo:planner:2', source: 'planner', plannerTaskId: 'demo-plan-task-2',
    fields: {
      Title: 'Design new onboarding flow', Complete: false,
      DueDate: inDays(9), CompletionDate: null, CompletedByLookupId: null, CompletedByLookupValue: '',
      Created: inDays(-6), Description: '', SourceLabel: 'Product Launch',
    },
    demoChecklist: [],
  },
  {
    id: 'demo:planner:3', source: 'planner', plannerTaskId: 'demo-plan-task-3',
    fields: {
      Title: 'Sketch Q4 roadmap', Complete: false,
      DueDate: null, CompletionDate: null, CompletedByLookupId: null, CompletedByLookupValue: '',
      Created: inDays(-1), Description: '', SourceLabel: 'Planning Board',
    },
    demoChecklist: [],
  },
];

export const demoApprovalTasks = [
  {
    name: 'demo-approval-1',
    environmentId: 'demo-env-1',
    environmentName: 'Riverton Production',
    properties: {
      title: 'Expense report — client dinner ($240)',
      priority: 'High',
      creationDate: inDays(-2),
      principals: [{ id: 'p1', displayName: 'Jamie Chen', email: 'jamie.chen@example.com' }],
      owner: { id: 'p1' },
      details: 'Client dinner with Northbridge Supplies during the renewal discussion. Receipt attached to the expense item.',
      item: { link: 'https://example.com', displayName: 'Expense report #4821' },
      userRequest: { responseOptions: ['Approve', 'Reject'] },
    },
  },
  {
    name: 'demo-approval-2',
    environmentId: 'demo-env-1',
    environmentName: 'Riverton Production',
    properties: {
      title: 'New vendor onboarding — Northbridge Supplies',
      priority: 'Medium',
      creationDate: inDays(-1),
      principals: [{ id: 'p2', displayName: 'Morgan Lee', email: 'morgan.lee@example.com' }],
      owner: { id: 'p2' },
      details: '',
      item: { link: '', displayName: '' },
      userRequest: { responseOptions: ['Approve', 'Reject'] },
    },
  },
  {
    name: 'demo-approval-3',
    environmentId: 'demo-env-2',
    environmentName: 'Riverton Sandbox',
    properties: {
      title: 'Time off request — 3 days',
      priority: 'Low',
      creationDate: inDays(0),
      principals: [{ id: 'p3', displayName: 'Priya Nair', email: 'priya.nair@example.com' }],
      owner: { id: 'p3' },
      details: '',
      item: { link: '', displayName: '' },
      userRequest: { responseOptions: ['Approve', 'Reject'] },
    },
  },
];

// ─── Start ────────────────────────────────────────────────────────────────────

export function startDemo() {
  const { setData } = useStore.getState();
  setData('isDemo', true);
  setData('currentUser', demoCurrentUser);
  setData('todoTasks', demoTodoTasks);
  setData('todoLoaded', true);
  setData('plannerTasks', demoPlannerTasks);
  setData('plannerLoaded', true);
  setData('approvalTasks', demoApprovalTasks);
  setData('approvalsLoaded', true);
  setData('lastRefreshed', Date.now());
}

// ─── Actions — mutate the store directly, no network involved ─────────────────

export function completeDemoTask(task) {
  // Real completions disappear from the list because the app refetches
  // afterward and the server only ever returns open tasks (see TaskView.jsx's
  // note on why there's no Completed tab). There's no server to refetch from
  // here, so mimic that by just removing the task rather than marking it done.
  const { todoTasks, plannerTasks, setData } = useStore.getState();
  if (task.source === 'todo') {
    setData('todoTasks', todoTasks.filter((t) => t.id !== task.id));
  } else {
    setData('plannerTasks', plannerTasks.filter((t) => t.id !== task.id));
  }
}

export function toggleDemoChecklistItem(task, itemId, isChecked) {
  const { plannerTasks, setData } = useStore.getState();
  setData('plannerTasks', plannerTasks.map((t) => (
    t.id === task.id
      ? { ...t, demoChecklist: t.demoChecklist.map((i) => (i.id === itemId ? { ...i, isChecked } : i)) }
      : t
  )));
}

export function respondToDemoApproval(task) {
  const { approvalTasks, setData } = useStore.getState();
  setData('approvalTasks', approvalTasks.filter((t) => t.name !== task.name));
}
