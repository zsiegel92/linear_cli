#!/usr/bin/env tsx
import { config } from "dotenv";
import { getUserSelections } from "./fzf-selection";
import { getIssues } from "./linear";
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
      display: `[${issue.team.key} - ${
        issue.assignee?.displayName ?? "UNASSIGNED"
      }] ${issue.title}`,
      // previewPrefix: `${issue.title}\n\n`,
      previewSuffix: issue.description ?? "",
    })),
    getPreview: async (item) => {
      const preview = item
        ? `\x1b[1m${item.display}\x1b[0m\n\n• id: ${item.id}\n\n# add any rich preview here`
        : "";
      return preview;
    },
  });
  console.log(selections);
  console.log(JSON.stringify(issues, null, 2));
}

// npx tsx linear_cli.ts
main().then(() => console.log("done"));
