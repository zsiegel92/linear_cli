#!/usr/bin/env node

// src/linear_cli.ts
import { config } from "dotenv";

// src/fzf-selection.ts
import { spawn, exec } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
async function getTempFilePath(prefix = "myapp-") {
  const tempDir = await fs.mkdtemp(join(tmpdir(), prefix));
  return join(tempDir, "somefile.tmp");
}
async function getUserSelections({
  items,
  fzfArgs = [
    "--no-sort",
    "--no-mouse",
    "--wrap",
    "--bind",
    // let the user scroll the preview with Alt-↑/↓/u/d
    "alt-up:preview-up,alt-down:preview-down,alt-u:preview-page-up,alt-d:preview-page-down"
  ],
  getPreview
}) {
  if (!items.length) {
    return void 0;
  }
  const tmpSel = await getTempFilePath();
  const tmpPrev = await getTempFilePath();
  await Promise.all([fs.writeFile(tmpSel, ""), fs.writeFile(tmpPrev, "")]);
  let locked = false;
  const monitor = setInterval(async () => {
    if (locked) return;
    try {
      const hovered = (await fs.readFile(tmpSel, "utf8")).trim();
      if (hovered) {
        const item2 = items.find((i) => i.id === hovered);
        if (!item2) return;
        if (!getPreview) return;
        const preview = await getPreview(item2);
        let fullPreview = preview;
        if (item2.previewPrefix) {
          fullPreview = `${item2.previewPrefix}

${preview}`;
        }
        if (item2.previewSuffix) {
          fullPreview = `${preview}

${item2.previewSuffix}`;
        }
        await fs.writeFile(tmpPrev, fullPreview);
        await fs.writeFile(tmpSel, "");
      }
    } catch {
    }
  }, 10);
  const previewCmd = [
    `SEL="${tmpSel}"`,
    `PREV="${tmpPrev}"`,
    `bash -c '`,
    `  echo "$1" > "$SEL";`,
    `  while [[ -s "$SEL" ]]; do sleep 0.01; done;`,
    `  cat "$PREV"`,
    `' -- {1}`
  ].join(" ");
  const args = [
    ...fzfArgs,
    "--delimiter= ",
    "--with-nth=2..",
    // show only the ‘display’ column in the list
    ...getPreview ? ["--preview", previewCmd] : []
  ];
  const child = spawn("fzf", args, {
    stdio: ["pipe", "pipe", "inherit"]
  });
  child.stdin.write(items.map((i) => `${i.id} ${i.display}`).join("\n"));
  child.stdin.end();
  let out = "";
  for await (const chunk of child.stdout) out += chunk;
  const code = await new Promise((r) => child.on("close", r));
  clearInterval(monitor);
  if (code === 1 || code === 130) {
    return void 0;
  }
  if (code !== 0) throw new Error(`fzf exited with ${code}`);
  const chosenIds = out.trim().split("\n").map((l) => l.split(" ")[0]);
  const item = items.find((i) => chosenIds.includes(i.id));
  if (!item) throw new Error(`No item found for id: ${chosenIds}`);
  return item;
}
async function checkIfFzfIsInstalled() {
  const child = exec("fzf --version");
  const code = await new Promise((r) => child.on("close", r));
  return code === 0;
}

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
  url: z.string()
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
            } 
        } 
    }
  `);
  return linearIssueResponseSchema.parse(issues).data.issues.nodes;
}

// src/utils.ts
import { exec as exec2 } from "child_process";
function copyToClipboard(text) {
  return exec2(`echo ${text} | pbcopy`);
}
function openInBrowser(url) {
  return exec2(`open ${url}`);
}

// src/linear_cli.ts
config();
async function main() {
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
    throw new Error("fzf is not installed! Install it with `brew install fzf`");
  }
  console.log("Fetching issues...");
  const issues = await getIssues();
  console.log(`Found ${issues.length} issues`);
  const previewItem = (issue) => `
\x1B[1m
[${issue.team.key} - ${issue.assignee?.displayName ?? "UNASSIGNED"}] ${issue.title}
\x1B[0m
\x1B[1m${issue.branchName}\x1B[0m
\x1B[1m${issue.url}\x1B[0m
${issue.description ?? ""}
`;
  const selection = await getUserSelections({
    items: issues.map((issue) => ({
      id: issue.id,
      display: `[${issue.team.key} - ${issue.assignee?.displayName ?? "UNASSIGNED"}] ${issue.title}`,
      fullItem: issue
    })),
    getPreview: async (item) => {
      return previewItem(item.fullItem);
    }
  });
  if (!selection) {
    console.log("No issue selected");
    return;
  }
  const action = await getUserSelections({
    items: actions.map((action2) => {
      switch (action2) {
        case "copy-branch-name":
          return {
            id: action2,
            display: `Copy branch name (${selection.fullItem.branchName})`
          };
        case "open-in-browser":
          return {
            id: action2,
            display: `Open in browser (${selection.fullItem.url})`
          };
        case "copy-issue-url":
          return {
            id: action2,
            display: `Copy issue URL (${selection.fullItem.url})`
          };
      }
    }),
    getPreview: void 0
  });
  if (!action) {
    console.log("No action selected");
    return;
  }
  switch (action.id) {
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
      console.log(`Copied issue URL to clipboard (${selection.fullItem.url})`);
      break;
  }
}
main().then(() => console.log("done"));
