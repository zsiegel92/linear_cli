#!/usr/bin/env node

// src/linear_cli.ts
import { config } from "dotenv";

// src/fzf-selection.ts
import { spawn } from "child_process";
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
    "--cycle",
    "--no-sort",
    "--bind",
    // let the user scroll the preview with Alt-↑/↓/u/d
    "alt-up:preview-up,alt-down:preview-down,alt-u:preview-page-up,alt-d:preview-page-down"
  ],
  getPreview
}) {
  if (!items.length) return [];
  const tmpSel = await getTempFilePath();
  const tmpPrev = await getTempFilePath();
  await Promise.all([fs.writeFile(tmpSel, ""), fs.writeFile(tmpPrev, "")]);
  let locked = false;
  const monitor = setInterval(async () => {
    if (locked) return;
    try {
      const hovered = (await fs.readFile(tmpSel, "utf8")).trim();
      if (hovered) {
        const item = items.find((i) => i.id === hovered);
        if (!item) return;
        const preview = await getPreview(item);
        let fullPreview = preview;
        if (item.previewPrefix) {
          fullPreview = `${item.previewPrefix}

${preview}`;
        }
        if (item.previewSuffix) {
          fullPreview = `${preview}

${item.previewSuffix}`;
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
    "--preview",
    previewCmd
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
  if (code === 1 || code === 130) return [];
  if (code !== 0) throw new Error(`fzf exited with ${code}`);
  const chosenIds = out.trim().split("\n").map((l) => l.split(" ")[0]);
  return items.filter((i) => chosenIds.includes(i.id));
}

// src/linear.ts
import { LinearClient } from "@linear/sdk";

// src/schema.ts
import { z } from "zod";
var linearTeamSchema = z.object({
  name: z.string(),
  id: z.string(),
  key: z.string(),
  inviteHash: z.string()
});
var linearStateSchema = z.object({
  name: z.string(),
  type: z.string()
});
var linearCycleSchema = z.object({
  name: z.string(),
  team: linearTeamSchema
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
  dueDate: z.string().nullable()
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

// src/linear.ts
async function getIssues() {
  const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY
  });
  const linearGraphQLClient = linearClient.client;
  const issues = await linearGraphQLClient.rawRequest(`
    query Me { 
        issues(orderBy: updatedAt) { 
            nodes { 
                id 
                title 
                updatedAt
                description
                branchName
                createdAt
                updatedAt
                team {
                    name
                    displayName
                    id
                    key
                    inviteHash
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
                    team {
                        name
                        displayName
                        id
                        key
                        inviteHash
                    }
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

// src/linear_cli.ts
config();
async function main() {
  if (!process.env.LINEAR_API_KEY) {
    throw new Error(
      "LINEAR_API_KEY is not set! Define in ~/.zshrc or something similar."
    );
  }
  const issues = await getIssues();
  const selections = await getUserSelections({
    items: issues.map((issue) => ({
      id: issue.id,
      display: `[${issue.team.key} - ${issue.assignee?.displayName ?? "UNASSIGNED"}] ${issue.title}`,
      // previewPrefix: `${issue.title}\n\n`,
      previewSuffix: issue.description ?? ""
    })),
    getPreview: async (item) => {
      const preview = item ? `\x1B[1m${item.display}\x1B[0m

\u2022 id: ${item.id}

# add any rich preview here` : "";
      return preview;
    }
  });
  console.log(selections);
  console.log(JSON.stringify(issues, null, 2));
}
main().then(() => console.log("done"));
