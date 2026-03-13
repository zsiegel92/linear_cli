import { z } from "zod";

const linearTeamSchema = z.object({
  name: z.string(),
  key: z.string(),
});

const statusTypes = [
  "triage",
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
  "review",
] as const;

type StatusType = (typeof statusTypes)[number];

const linearStateTypeSchema = z.enum(statusTypes);

const stateIconMap = {
  unstarted: "⭕️" as const,
  triage: "🔶" as const,
  backlog: "⛔️" as const,
  started: "🟡" as const,
  review: "🟣" as const,
  completed: "🟢" as const,
  canceled: "❌" as const,
} as const satisfies Record<StatusType, string>;

const stateNameIconMap: Record<string, string> = {
  "In Progress": "🟡",
  "In Code Review": "🟣",
  "In Review": "🟣",
  "In Product Acceptance": "🟢",
  "DS/AQ/SS feedback needed": "🔵",
  Triage: "🔶",
  Sentry: "⛔️",
  Untriaged: "⛔️",
  Icebox: "⛔️",
  Todo: "⭕️",
  Backlog: "⭕️",
  Done: "✅",
  Canceled: "❌",
  Duplicate: "❌",
};

const stateColorMap = {
  backlog: "#bec2c8" as const,
  unstarted: "#e2e2e2" as const,
  triage: "#FC7840" as const,
  started: "#f2c94c" as const,
  completed: "#5e6ad2" as const,
  canceled: "#95a2b3" as const,
  review: "#0f783c" as const,
} as const satisfies Record<StatusType, string>;

const linearStateSchema = z
  .object({
    name: z.string(),
    type: linearStateTypeSchema,
  })
  .transform((data) => ({
    ...data,
    get stateIcon() {
      return stateNameIconMap[data.name] ?? stateIconMap[data.type] ?? "❓";
    },
    get stateColor() {
      return stateColorMap[data.type] ?? "#888888";
    },
  }));

export const stateMap = z.record(z.string(), linearStateSchema);
export type StateMap = z.input<typeof stateMap>;

const linearCycleSchema = z.object({
  name: z.string().nullable(),
});

const linearUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  displayName: z.string(),
});

export const linearProjectSchema = z.object({
  name: z.string(),
  color: z.string(),
  slugId: z.string(),
  id: z.string(),
});

const linearIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  updatedAt: z.string(),
  assignee: linearUserSchema.nullable(),
  team: linearTeamSchema,
  state: linearStateSchema,
  cycle: linearCycleSchema.nullable(),
  description: z.string().nullable(),
  branchName: z.string(),
  createdAt: z.string(),
  estimate: z.number().nullable(),
  priority: z.number().nullable(),
  priorityLabel: z.string().nullable(),
  startedAt: z.string().nullable(),
  creator: linearUserSchema.nullable(),
  dueDate: z.string().nullable(),
  url: z.string(),
  project: linearProjectSchema.nullable(),
});
export type LinearIssue = z.infer<typeof linearIssueSchema>;

export const linearIssueResponseSchema = z.object({
  data: z.object({
    issues: z.object({
      nodes: z.array(linearIssueSchema),
    }),
  }),
  headers: z.object({}),
  status: z.number(),
});

export const actions = [
  "copy-branch-name",
  "open-in-browser",
  "copy-issue-url",
  "copy-issue-description-markdown",
] as const;
export type Action = (typeof actions)[number];

export type LinearAuth =
  | {
      apiKey: string;
    }
  | {
      accessToken: string;
    };

export const linearAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string(),
  refresh_token: z.string().optional(),
});
export type LinearAuthResponse = z.infer<typeof linearAuthResponseSchema>;

export const linearAuthResponseWithExpiryDateSchema =
  linearAuthResponseSchema.extend({
    expiryDate: z.coerce.date(),
  });

export type LinearAuthResponseWithExpiryDate = z.infer<
  typeof linearAuthResponseWithExpiryDateSchema
>;
