"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linearIssueResponseSchema = void 0;
var zod_1 = require("zod");
var linearTeamSchema = zod_1.z.object({
    name: zod_1.z.string(),
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    inviteHash: zod_1.z.string(),
});
var linearStateSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.string(),
});
var linearCycleSchema = zod_1.z.object({
    name: zod_1.z.string(),
    team: linearTeamSchema,
});
var linearUserSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string(),
    displayName: zod_1.z.string(),
});
var linearIssueSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    assignee: linearUserSchema.nullable(),
    team: linearTeamSchema,
    state: linearStateSchema,
    cycle: linearCycleSchema.nullable(),
    description: zod_1.z.string().nullable(),
    branchName: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    estimate: zod_1.z.number().nullable(),
    priority: zod_1.z.number().nullable(),
    priorityLabel: zod_1.z.string().nullable(),
    startedAt: zod_1.z.string().nullable(),
    creator: linearUserSchema,
    dueDate: zod_1.z.string().nullable(),
});
exports.linearIssueResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        issues: zod_1.z.object({
            nodes: zod_1.z.array(linearIssueSchema),
        }),
    }),
    headers: zod_1.z.object({}),
    status: zod_1.z.number(),
});
