import { LinearIssue } from "./schema";

type Team = LinearIssue["team"]
type User = LinearIssue["assignee"]
type Project = LinearIssue["project"]
type State = LinearIssue["state"]
type Cycle = LinearIssue["cycle"]

// Define reusable objects
const users: Record<string, NonNullable<User>> = {
  alice: {
    name: "Alice Smith",
    email: "alice@company.com",
    displayName: "Alice"
  },
  bob: {
    name: "Bob Johnson",
    email: "bob@company.com",
    displayName: "Bob"
  },
  charlie: {
    name: "Charlie Williams",
    email: "charlie@company.com",
    displayName: "Charlie"
  }
};

const teams: Record<string, Team> = {
  frontend: {
    name: "Frontend",
    key: "FE"
  },
  backend: {
    name: "Backend",
    key: "BE"
  },
  design: {
    name: "Design",
    key: "DS"
  }
};

const states: Record<string, State> = {
  backlog: {
    name: "Backlog",
    type: "backlog"
  },
  toDo: {
    name: "To Do",
    type: "unstarted"
  },
  inProgress: {
    name: "In Progress",
    type: "started"
  },
  inReview: {
    name: "In Review",
    type: "review"
  },
  done: {
    name: "Done",
    type: "completed"
  }
};

const cycles: Record<string, NonNullable<Cycle>> = {
  current: {
    name: "Sprint 24"
  },
  next: {
    name: "Sprint 25"
  }
};

const projects: Record<string, NonNullable<Project>> = {
  dashboard: {
    name: "Dashboard Redesign",
    color: "#0000FF",
    slugId: "dashboard-redesign",
    id: "proj_123"
  },
  auth: {
    name: "Auth System",
    color: "#FF0000",
    slugId: "auth-system",
    id: "proj_456"
  },
  analytics: {
    name: "Analytics Platform",
    color: "#00FF00",
    slugId: "analytics-platform",
    id: "proj_789"
  }
};

// Export mock issues
export const issues: LinearIssue[] = [
  {
    id: "LIN-101",
    title: "Implement new login form",
    updatedAt: "2023-05-15T14:30:00Z",
    assignee: users.alice,
    team: teams.frontend,
    state: states.inProgress,
    cycle: cycles.current,
    description: "Create a new login form with improved validation and error handling.",
    branchName: "feature/login-form",
    createdAt: "2023-05-10T09:00:00Z",
    estimate: 3,
    priority: 2,
    priorityLabel: "High",
    startedAt: "2023-05-12T10:15:00Z",
    creator: users.bob,
    dueDate: "2023-05-25T23:59:59Z",
    url: "https://linear.app/company/issue/LIN-101",
    project: projects.auth
  },
  {
    id: "LIN-102",
    title: "Fix API rate limiting",
    updatedAt: "2023-05-14T16:45:00Z",
    assignee: users.bob,
    team: teams.backend,
    state: states.inReview,
    cycle: cycles.current,
    description: "Resolve issues with API rate limiting that causes errors during high traffic.",
    branchName: "fix/api-rate-limiting",
    createdAt: "2023-05-09T13:20:00Z",
    estimate: 5,
    priority: 1,
    priorityLabel: "Urgent",
    startedAt: "2023-05-10T08:30:00Z",
    creator: users.charlie,
    dueDate: "2023-05-18T23:59:59Z",
    url: "https://linear.app/company/issue/LIN-102",
    project: projects.auth
  },
  {
    id: "LIN-103",
    title: "Design dashboard widgets",
    updatedAt: "2023-05-13T11:20:00Z",
    assignee: users.charlie,
    team: teams.design,
    state: states.done,
    cycle: cycles.current,
    description: "Create design mockups for new dashboard widgets.",
    branchName: "design/dashboard-widgets",
    createdAt: "2023-05-05T10:00:00Z",
    estimate: 2,
    priority: 3,
    priorityLabel: "Medium",
    startedAt: "2023-05-06T09:00:00Z",
    creator: users.alice,
    dueDate: "2023-05-12T23:59:59Z",
    url: "https://linear.app/company/issue/LIN-103",
    project: projects.dashboard
  },
  {
    id: "LIN-104",
    title: "Implement data visualization components",
    updatedAt: "2023-05-16T15:10:00Z",
    assignee: users.alice,
    team: teams.frontend,
    state: states.toDo,
    cycle: cycles.next,
    description: "Build reusable chart components for analytics dashboard.",
    branchName: "feature/data-viz",
    createdAt: "2023-05-15T14:00:00Z",
    estimate: 8,
    priority: 2,
    priorityLabel: "High",
    startedAt: null,
    creator: users.bob,
    dueDate: "2023-06-01T23:59:59Z",
    url: "https://linear.app/company/issue/LIN-104",
    project: projects.analytics
  },
  {
    id: "LIN-105",
    title: "Setup database migrations",
    updatedAt: "2023-05-12T08:30:00Z",
    assignee: null,
    team: teams.backend,
    state: states.backlog,
    cycle: null,
    description: "Configure automated database migration process.",
    branchName: "chore/db-migrations",
    createdAt: "2023-05-01T11:45:00Z",
    estimate: null,
    priority: 4,
    priorityLabel: "Low",
    startedAt: null,
    creator: users.bob,
    dueDate: null,
    url: "https://linear.app/company/issue/LIN-105",
    project: null
  }
];