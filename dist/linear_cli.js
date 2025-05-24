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
  name: z.string().nullable()
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
import { z as z2 } from "zod";
async function getIssues(onlyMine = false, projectId = void 0) {
  const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY
  });
  const linearGraphQLClient = linearClient.client;
  let filterArgs = "orderBy: updatedAt, first: 80";
  const filterParts = [];
  if (onlyMine) {
    const me = await linearClient.viewer;
    filterParts.push(`assignee: { id: { eq: "${me.id}" } }`);
  }
  if (projectId) {
    filterParts.push(`project: { id: { eq: "${projectId}" } }`);
  }
  if (filterParts.length > 0) {
    filterArgs += `, filter: { ${filterParts.join(", ")} }`;
  }
  const query = `
    query Me { 
        issues(${filterArgs}) {
            nodes { 
                id 
                title 
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
  `;
  const issues = await linearGraphQLClient.rawRequest(query);
  return linearIssueResponseSchema.parse(issues).data.issues.nodes;
}
async function getProjects() {
  const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY
  });
  const linearGraphQLClient = linearClient.client;
  const projects = await linearGraphQLClient.rawRequest(`
    query GetProjects { 
        projects(first: 100) {
            nodes { 
                id
                name
                color
                slugId
            } 
        } 
    }
  `);
  const projectResponseSchema = z2.object({
    data: z2.object({
      projects: z2.object({
        nodes: z2.array(linearProjectSchema)
      })
    })
  });
  return projectResponseSchema.parse(projects).data.projects.nodes;
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
var preservedChars = ":()[]{}";
function getSlug(text) {
  if (!text) {
    return "";
  }
  return text.trim().split(" ").map((word) => {
    let result = "";
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (i === 0 || preservedChars.includes(char)) {
        result += char;
      }
    }
    return result;
  }).join("");
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
    [
      underline(
        bold(issue.project?.name ?? "<No Project Specified For Issue>")
      ),
      projectSlug ? `(${projectSlug})` : null
    ].filter(isNotNullOrUndefined).map((item) => teamColor(item)).join(" - "),
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
    issues.map((issue) => [issue.project?.id, getSlug(issue.project?.name)])
  );
  return teamProjectSlugs;
};
var renderIssueList = (issues) => {
  const teamColors = getTeamColors(issues);
  const teamProjectSlugs = getTeamProjectSlugs(issues);
  return issues.map((issue) => displayItem(issue, teamColors, teamProjectSlugs)).join("\n");
};
async function selectProject(projects, issues) {
  const projectIssuesMap = /* @__PURE__ */ new Map();
  projects.forEach((project) => {
    projectIssuesMap.set(project.id, []);
  });
  issues.forEach((issue) => {
    if (issue.project?.id) {
      const projectIssues = projectIssuesMap.get(issue.project.id) || [];
      projectIssues.push(issue);
      projectIssuesMap.set(issue.project.id, projectIssues);
    }
  });
  const selection = await getUserSelection({
    items: projects.map((project) => {
      const projectIssues = projectIssuesMap.get(project.id) || [];
      const lastUpdated = projectIssues.length > 0 ? new Date(projectIssues[0].updatedAt) : null;
      const updatedString = lastUpdated ? ` updated ${new Date(lastUpdated).toLocaleDateString()}` : "";
      return {
        id: project.id,
        display: [
          blue(project.name),
          `(${projectIssues.length} issue${projectIssues.length === 1 ? "" : "s"}${updatedString})`
        ].join(" - "),
        fullItem: project
      };
    }),
    getPreview: async (item) => {
      const projectIssues = projectIssuesMap.get(item.fullItem.id) || [];
      if (projectIssues.length === 0) {
        return `${bold(item.fullItem.name)}

No issues in this project`;
      }
      return `${bold(item.fullItem.name)}

${renderIssueList(projectIssues)}`;
    }
  });
  return selection;
}
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
import minimist from "minimist";
config();
async function main() {
  const args = minimist(process.argv.slice(2), {
    alias: {
      h: "help",
      m: "me",
      p: "projects"
    },
    boolean: ["help", "me", "projects"]
  });
  if (args.help) {
    console.log(`Linear CLI - Select and interact with Linear issues

Usage: linear-cli [options]

Options:
  -h, --help      Show this help message
  -m, --me        Show only issues assigned to you
  -p, --projects  Select a project first, then show issues from that project
`);
    return;
  }
  try {
    let issues;
    let projectId;
    if (args.projects) {
      console.log("Fetching projects...");
      const [projects, issues2] = await Promise.all([
        getProjects(),
        getIssues(false, void 0)
      ]);
      console.log("Fetching issues for project preview...");
      const projectSelection = await selectProject(projects, issues2);
      if (!projectSelection) {
        console.log("No project selected");
        return;
      }
      projectId = projectSelection.fullItem.id;
      console.log(`Selected project: ${projectSelection.fullItem.name}`);
    }
    console.log("Fetching issues...");
    try {
      issues = await getIssues(args.me, projectId);
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
