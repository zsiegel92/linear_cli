import { config } from "dotenv";
import { getUserSelections } from "./fzf-selection";
import { getIssues } from "./linear";
import { actions } from "./schema";
import { copyToClipboard, openInBrowser } from "./utils";
config();

async function main() {
  if (!process.env.LINEAR_API_KEY) {
    throw new Error(
      `LINEAR_API_KEY is not set! Define in ~/.zshrc with
      \`export LINEAR_API_KEY='<your-api-key>'\`
      or something similar.`
    );
  }
  const issues = await getIssues();
  const previewItem = (issue: (typeof issues)[number]) => `
\x1b[1m
[${issue.team.key} - ${issue.assignee?.displayName ?? "UNASSIGNED"}] ${
    issue.title
  }
\x1b[0m
\x1b[1m${issue.branchName}\x1b[0m
\x1b[1m${issue.url}\x1b[0m
${issue.description ?? ""}
`;
  const selection = await getUserSelections({
    items: issues.map((issue) => ({
      id: issue.id,
      display: `[${issue.team.key} - ${
        issue.assignee?.displayName ?? "UNASSIGNED"
      }] ${issue.title}`,
      fullItem: issue,
    })),
    getPreview: async (item) => {
      return previewItem(item.fullItem);
    },
  });
  if (!selection) {
    console.log("No issue selected");
    return;
  }
  const action = await getUserSelections({
    items: actions.map((action) => {
      switch (action) {
        case "copy-branch-name":
          return {
            id: action,
            display: `Copy branch name (${selection.fullItem.branchName})`,
          };
        case "open-in-browser":
          return {
            id: action,
            display: `Open in browser (${selection.fullItem.url})`,
          };
        case "copy-issue-url":
          return {
            id: action,
            display: `Copy issue URL (${selection.fullItem.url})`,
          };
      }
    }),
    getPreview: async (item) => item.display,
  });
  if (!action) {
    console.log("No action selected");
    return;
  }
  switch (action.id) {
    case "copy-branch-name":
      await copyToClipboard(selection.fullItem.branchName);
      break;
    case "open-in-browser":
      await openInBrowser(selection.fullItem.url);
      break;
    case "copy-issue-url":
      await copyToClipboard(selection.fullItem.url);
      break;
  }
}

// npx tsx linear_cli.ts
main().then(() => console.log("done"));
