export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/decisions", label: "Decisions", icon: "CheckSquare" },
  { href: "/outputs", label: "Outputs", icon: "Package" },
  { href: "/goals", label: "Goals", icon: "Target" },
  { href: "/tasks", label: "Tasks", icon: "KanbanSquare" },
  { href: "/team", label: "Team", icon: "Users" },
  { href: "/gateways", label: "Gateways", icon: "Server" },
  { href: "/compliance", label: "Compliance", icon: "ShieldAlert" },
  { href: "/runs", label: "Runs", icon: "Activity" },
] as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  blocked: "Blocked",
  waiting_decision: "Waiting Decision",
  done: "Done",
  canceled: "Canceled",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500",
  in_progress: "bg-blue-500",
  blocked: "bg-red-500",
  waiting_decision: "bg-yellow-500",
  done: "bg-green-500",
  canceled: "bg-zinc-500",
};

export const KANBAN_COLUMNS = ["todo", "in_progress", "blocked", "waiting_decision", "done"] as const;

export const DECISION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
  canceled: "Canceled",
};

export const DECISION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  changes_requested: "bg-orange-500",
  canceled: "bg-zinc-500",
};

export const RUN_STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  waiting_decision: "Waiting Decision",
  succeeded: "Succeeded",
  failed: "Failed",
  canceled: "Canceled",
};

export const RUN_STATUS_COLORS: Record<string, string> = {
  queued: "bg-slate-500",
  running: "bg-blue-500",
  waiting_decision: "bg-yellow-500",
  succeeded: "bg-green-500",
  failed: "bg-red-500",
  canceled: "bg-zinc-500",
};

export const AGENT_STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  running: "Running",
  waiting_decision: "Waiting Decision",
  blocked: "Blocked",
  error: "Error",
  offline: "Offline",
  paused: "Paused",
};

export const AGENT_STATUS_COLORS: Record<string, string> = {
  idle: "bg-slate-500",
  running: "bg-blue-500",
  waiting_decision: "bg-yellow-500",
  blocked: "bg-red-500",
  error: "bg-red-600",
  offline: "bg-zinc-500",
  paused: "bg-orange-500",
};

export const GOAL_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const PRIORITY_LABELS: Record<string, string> = {
  p1: "P1",
  p2: "P2",
  p3: "P3",
};

export const PRIORITY_COLORS: Record<string, string> = {
  p1: "bg-red-500",
  p2: "bg-orange-500",
  p3: "bg-blue-500",
};

export const OUTPUT_TYPE_LABELS: Record<string, string> = {
  research: "Research",
  doc: "Doc",
  code_diff: "Code Diff",
  summary: "Summary",
  linkset: "Linkset",
  image: "Image",
  video: "Video",
  architecture: "Architecture",
  decision: "Decision",
  other: "Other",
};

export const COMPLIANCE_SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500",
  warn: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export const COMPLIANCE_SEVERITY_LABELS: Record<string, string> = {
  info: "Info",
  warn: "Warn",
  high: "High",
  critical: "Critical",
};
