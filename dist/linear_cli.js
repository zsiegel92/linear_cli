#!/usr/bin/env node

// src/linear_cli.ts
import { config } from "dotenv";
import { checkIfFzfIsInstalled } from "fzf-ts";

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
var linearAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string()
});

// src/linear.ts
import { LinearClient } from "@linear/sdk";
import { z as z2 } from "zod";
function getAuth() {
  if (process.env.LINEAR_OAUTH_TOKEN) {
    console.log("Using OAuth token");
    return {
      accessToken: process.env.LINEAR_OAUTH_TOKEN
    };
  }
  if (process.env.LINEAR_API_KEY) {
    console.log("Using API key");
    return {
      apiKey: process.env.LINEAR_API_KEY
    };
  }
  throw new Error("No Linear API key or OAuth token found");
}
async function getIssues(onlyMine = false, projectId = void 0) {
  const auth = getAuth();
  const linearClient = new LinearClient(auth);
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
  const auth = getAuth();
  const linearClient = new LinearClient(auth);
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
  return exec(`open "${url}"`);
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
var PRESERVED = ":()[]{}-&";
function getSlug(text) {
  const preservedSet = new Set(PRESERVED);
  if (!text) return "";
  return text.trim().split(/\s+/).map((word) => {
    if (!word) return "";
    let haveNonPreservedChar = false;
    let accepted = [];
    for (const char of word) {
      if (preservedSet.has(char)) {
        accepted.push(char);
      } else if (!haveNonPreservedChar) {
        haveNonPreservedChar = true;
        accepted.push(char);
      }
    }
    return accepted.join("");
  }).join("");
}
function isNotNullOrUndefined(value) {
  return value !== null && value !== void 0;
}
function showNumberOfDaysAgo(dateString) {
  try {
    const date = new Date(dateString);
    const daysAgo = Math.floor(
      (Date.now() - date.getTime()) / (1e3 * 60 * 60 * 24)
    );
    return `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
  } catch (e) {
    return null;
  }
}

// src/ui.ts
import { getUserSelection, defaultFzfArgs } from "fzf-ts";
var previewIssue = (issue, teamColors, teamProjectSlugs) => {
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
    issue.updatedAt ? `Updated ${showNumberOfDaysAgo(issue.updatedAt)}` : null,
    bold(issue.branchName),
    bold(issue.url ?? ""),
    "\n",
    issue.description ?? ""
  ].filter(isNotNullOrUndefined).join("\n");
};
var displayIssue = (issue, teamColors, teamProjectSlugs) => {
  const teamColor = teamColors.get(issue.team.key) ?? noColor;
  const projectSlug = teamProjectSlugs.get(issue.project?.id ?? "");
  const numberDaysAgoUpdatedMessage = issue.updatedAt ? ` (${showNumberOfDaysAgo(issue.updatedAt)})` : "";
  const metadataPrefix = [
    issue.assignee?.displayName ?? "UNASSIGNED",
    issue.team.key,
    projectSlug
  ].filter(isNotNullOrUndefined).map((item) => teamColor(item)).join(" - ");
  return `[${metadataPrefix}] ${issue.estimate ? `(${issue.estimate}) ` : ""}${blue(issue.title)}${numberDaysAgoUpdatedMessage}`;
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
  return issues.map((issue) => displayIssue(issue, teamColors, teamProjectSlugs)).join("\n");
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
      display: displayIssue(issue, teamColors, teamProjectSlugs),
      fullItem: issue
    })),
    getPreview: async (item) => {
      return previewIssue(item.fullItem, teamColors, teamProjectSlugs);
    },
    fzfArgs: [...defaultFzfArgs, "--preview-window=right:30%"]
  });
  return selection;
}
async function selectAction(selection, alreadyDoneActions) {
  const action = await getUserSelection({
    items: actions.map((action2) => {
      const alreadyDoneBadge = alreadyDoneActions.has(action2) ? "\u2705" : "";
      switch (action2) {
        case "copy-branch-name":
          return {
            id: action2,
            display: `${alreadyDoneBadge}Copy branch name (${selection.branchName})`
          };
        case "open-in-browser":
          return {
            id: action2,
            display: `${alreadyDoneBadge}Open in browser (${selection.url})`
          };
        case "copy-issue-url":
          return {
            id: action2,
            display: `${alreadyDoneBadge}Copy issue URL (${selection.url})`
          };
      }
    }),
    getPreview: void 0,
    fzfArgs: [...defaultFzfArgs, "--header=Select an action (ctrl-c to exit)"]
  });
  return action?.id ?? null;
}
async function selectAndTakeAction(selectedIssue, alreadyDoneActions) {
  const action = await selectAction(selectedIssue, alreadyDoneActions);
  if (!action) {
    console.log("No action selected");
    return null;
  }
  switch (action) {
    case "copy-branch-name":
      copyToClipboard(selectedIssue.branchName);
      console.log(
        `Copied branch name to clipboard (${selectedIssue.branchName})`
      );
      break;
    case "open-in-browser":
      openInBrowser(selectedIssue.url);
      console.log(`Opened in browser (${selectedIssue.url})`);
      break;
    case "copy-issue-url":
      copyToClipboard(selectedIssue.url);
      console.log(`Copied issue URL to clipboard (${selectedIssue.url})`);
      break;
  }
  return action;
}
async function selectAndTakeActionLoop(selectedIssue, looping) {
  const doneActions = /* @__PURE__ */ new Set();
  while (true) {
    const action = await selectAndTakeAction(selectedIssue, doneActions);
    if (!looping || !action) {
      break;
    }
    doneActions.add(action);
  }
  return Array.from(doneActions);
}

// src/linear_cli.ts
import minimist from "minimist";
config();
async function main() {
  const args = minimist(process.argv.slice(2), {
    alias: {
      h: "help",
      m: "me",
      p: "projects",
      l: "loop"
    },
    boolean: ["help", "me", "projects", "loop"]
  });
  if (args.help) {
    console.log(`Linear CLI - Select and interact with Linear issues

Usage: linear-cli [options]

Options:
  -h, --help      Show this help message
  -m, --me        Show only issues assigned to you
  -p, --projects  Select a project first, then show issues from that project
  -l, --loop      Loop action selector (to copy branch name and open in browser, etc.)
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
    const doneActions = await selectAndTakeActionLoop(
      selection.fullItem,
      args.loop
    );
    console.log(`Done actions: ${doneActions.join(", ")}`);
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
