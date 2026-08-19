import { create } from 'zustand';

export const useStore = create((set) => ({
  // ─── Auth ─────────────────────────────────────────────────────────────────
  currentUser: { name: '', email: '' },
  isDemo:      false, // true once "Try the demo" is clicked — see api/demo.js

  // ─── Power Automate approvals ─────────────────────────────────────────────
  approvalTasks:    [],
  environments:     [], // every Power Automate environment the user can access, incl. ones with nothing pending
  approvalsLoaded:  false,
  approvalsLoading: false,

  // ─── Microsoft To Do — merged into the Tasks view ─────────────────────────
  todoTasks:     [],
  todoLoaded:    false,
  todoLoading:   false,
  showTodoTasks: true,

  // ─── Microsoft Planner — merged into the Tasks view ───────────────────────
  plannerTasks:     [],
  plannerLoaded:    false,
  plannerLoading:   false,
  showPlannerTasks: true,

  refreshing:    false,
  lastRefreshed: null,

  // ─── Navigation ─────────────────────────────────────────────────────────────
  view: 'tasks', // 'tasks' | 'approvals'

  // ─── Filters ──────────────────────────────────────────────────────────────
  search: '',

  // ─── Detail side panels ─────────────────────────────────────────────────────
  selectedTask:     null, // task object → detail side panel
  selectedApproval: null, // approval task object → detail side panel

  // ─── Toasts ───────────────────────────────────────────────────────────────
  toasts: [],

  // ─── Actions ──────────────────────────────────────────────────────────────
  setCurrentUser: (u)          => set({ currentUser: u }),
  setData:        (key, value) => set({ [key]: value }),
  setView:        (view)       => set({ view, selectedTask: null, selectedApproval: null }),
  setSearch:      (search)     => set({ search }),

  setSelectedTask:     (task) => set({ selectedTask: task }),
  setSelectedApproval: (task) => set({ selectedApproval: task }),

  addToast: (msg, type = 'info') =>
    set((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), msg, type }] })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
