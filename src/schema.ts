import { z } from "zod";

const linearTeamSchema = z.object({
  name: z.string(),
  key: z.string(),
});

const linearStateSchema = z.object({
  name: z.string(),
  type: z.string(),
});

const linearCycleSchema = z.object({
  name: z.string(),
});

const linearUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  displayName: z.string(),
});

const linearProjectSchema = z.object({
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
  creator: linearUserSchema,
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
] as const;
