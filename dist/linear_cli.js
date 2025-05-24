#!/usr/bin/env node

// src/linear_cli.ts
import { config } from "dotenv";
import { checkIfFzfIsInstalled } from "fzf-ts";

// src/linear.ts
import { LinearClient } from "@linear/sdk";

// src/schema.ts
import { z } from "zod";
var linearTeamSchema = z.object({
  name: z.string(),
  key: z.string()
});
var linearStateSchema = z.object({
  name: z.string(),
  type: z.string()
});
var linearCycleSchema = z.object({
  name: z.string()
});
var linearUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  displayName: z.string()
});
var linearProjectSchema = z.object({
  name: z.string(),
  color: z.string(),
  slugId: z.string(),
  id: z.string()
});
var linearIssueSchema = z.object({
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
  project: linearProjectSchema.nullable()
});
var linearIssueResponseSchema = z.object({
  data: z.object({
    issues: z.object({
      nodes: z.array(linearIssueSchema)
    })
  }),
  headers: z.object({}),
  status: z.number()
});
var actions = [
  "copy-branch-name",
  "open-in-browser",
  "copy-issue-url"
];

// src/linear.ts
async function getIssues() {
  const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY
  });
  const linearGraphQLClient = linearClient.client;
  const issues = await linearGraphQLClient.rawRequest(`
    query Me { 
        issues(orderBy: updatedAt, first: 80) {
            nodes { 
                id 
                title 
                updatedAt
                description
                branchName
                createdAt
                updatedAt
                url
                team {
                    name
                    displayName
                    key
                }
                state {
                    name
                    type
                }
                startedAt
                creator {
                    name
                    email
                    displayName
                }
                dueDate
                cycle {
                    name
                }
                dueDate
                estimate
                priority
                priorityLabel
                assignee { 
                    name 
                    displayName
                    email
                } 
                project {
                    name
                    color
                    slugId
                    id
                }
            } 
        } 
    }
  `);
  return linearIssueResponseSchema.parse(issues).data.issues.nodes;
}

// src/utils.ts
import { exec } from "child_process";
function copyToClipboard(text) {
  return exec(`echo ${text} | pbcopy`);
}
function openInBrowser(url) {
  return exec(`open ${url}`);
}
function bold(text) {
  return `\x1B[1m${text}\x1B[0m`;
}
function underline(text) {
  return `\x1B[4m${text}\x1B[0m`;
}
function blue(text) {
  return `\x1B[34m${text}\x1B[0m`;
}
function yellow(text) {
  return `\x1B[33m${text}\x1B[0m`;
}
function cyan(text) {
  return `\x1B[36m${text}\x1B[0m`;
}
function magenta(text) {
  return `\x1B[35m${text}\x1B[0m`;
}
function noColor(text) {
  return text;
}
var secondaryColors = [yellow, cyan, magenta];
function getSlug(text) {
  return text.split(":").map(
    (part) => part.trim().split(" ").map((word) => word[0]).join("")
  ).join("");
}
function isNotNullOrUndefined(value) {
  return value !== null && value !== void 0;
}

// src/ui.ts
import { getUserSelection } from "fzf-ts";
var previewItem = (issue, teamColors, teamProjectSlugs) => {
  const teamColor = teamColors.get(issue.team.key) ?? noColor;
  const projectSlug = teamProjectSlugs.get(issue.project?.id ?? "");
  return [
    [underline(bold(issue.project?.name ?? "")), `(${projectSlug})`].filter(isNotNullOrUndefined).map((item) => teamColor(item)).join(" - "),
    [blue(bold(issue.title)), issue.estimate ? `(${issue.estimate})` : null].filter(isNotNullOrUndefined).join(" - "),
    issue.creator?.displayName ? `Created by ${issue.creator?.displayName ?? "Unknown"} ${new Date(
      issue.createdAt
    ).toLocaleString()}` : null,
    bold(issue.branchName),
    bold(issue.url ?? ""),
    "\n",
    issue.description ?? ""
  ].filter(isNotNullOrUndefined).join("\n");
};
var displayItem = (issue, teamColors, teamProjectSlugs) => {
  const teamColor = teamColors.get(issue.team.key) ?? noColor;
  const projectSlug = teamProjectSlugs.get(issue.project?.id ?? "");
  return `[${[
    issue.assignee?.displayName ?? "UNASSIGNED",
    issue.team.key,
    projectSlug
  ].filter(isNotNullOrUndefined).map((item) => teamColor(item)).join(" - ")}]  ${issue.estimate ? `(${issue.estimate}) ` : ""}${blue(
    issue.title
  )}`;
};
var getTeamColors = (issues) => {
  const teamColors = new Map(
    [...new Set(issues.map((issue) => issue.team.key))].map(
      (teamKey, index) => [
        teamKey,
        secondaryColors[index % secondaryColors.length]
      ]
    )
  );
  return teamColors;
};
var getTeamProjectSlugs = (issues) => {
  const teamProjectSlugs = new Map(
    issues.map((issue) => [
      issue.project?.id,
      getSlug(issue.project?.name ?? "")
    ])
  );
  return teamProjectSlugs;
};
async function selectIssue(issues) {
  const teamColors = getTeamColors(issues);
  const teamProjectSlugs = getTeamProjectSlugs(issues);
  const selection = await getUserSelection({
    items: issues.map((issue) => ({
      id: issue.id,
      display: displayItem(issue, teamColors, teamProjectSlugs),
      fullItem: issue
    })),
    getPreview: async (item) => {
      return previewItem(item.fullItem, teamColors, teamProjectSlugs);
    }
  });
  return selection;
}
async function selectAction(selection) {
  const action = await getUserSelection({
    items: actions.map((action2) => {
      switch (action2) {
        case "copy-branch-name":
          return {
            id: action2,
            display: `Copy branch name (${selection.branchName})`
          };
        case "open-in-browser":
          return {
            id: action2,
            display: `Open in browser (${selection.url})`
          };
        case "copy-issue-url":
          return {
            id: action2,
            display: `Copy issue URL (${selection.url})`
          };
      }
    }),
    getPreview: void 0
  });
  return action?.id ?? null;
}

// src/linear_cli.ts
config();
async function main() {
  try {
    console.log("Fetching issues...");
    let issues;
    try {
      issues = await getIssues();
    } catch (err) {
      console.error("Error connecting to Linear API");
      return;
    }
    console.log(`Found ${issues.length} issues`);
    const selection = await selectIssue(issues);
    if (!selection) {
      console.log("No issue selected");
      return;
    }
    const action = await selectAction(selection.fullItem);
    if (!action) {
      console.log("No action selected");
      return;
    }
    switch (action) {
      case "copy-branch-name":
        copyToClipboard(selection.fullItem.branchName);
        console.log(
          `Copied branch name to clipboard (${selection.fullItem.branchName})`
        );
        break;
      case "open-in-browser":
        openInBrowser(selection.fullItem.url);
        console.log(`Opened in browser (${selection.fullItem.url})`);
        break;
      case "copy-issue-url":
        copyToClipboard(selection.fullItem.url);
        console.log(
          `Copied issue URL to clipboard (${selection.fullItem.url})`
        );
        break;
    }
  } catch (err) {
    if (!process.env.LINEAR_API_KEY) {
      throw new Error(
        `LINEAR_API_KEY is not set! Define in ~/.zshrc with
        \`export LINEAR_API_KEY='<your-api-key>'\`
        or something similar.
        
        Create a key at https://linear.app/current-ai/settings/account/security`
      );
    }
    const fzfInstalled = await checkIfFzfIsInstalled();
    if (!fzfInstalled) {
      throw new Error(
        "fzf is not installed! Install it with `brew install fzf`"
      );
    }
    throw err;
  }
}
main().then(() => console.log("done"));
