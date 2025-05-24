import { config } from "dotenv";
import { checkIfFzfIsInstalled } from "fzf-ts";
import { getIssues } from "./linear";
import { copyToClipboard, openInBrowser } from "./utils";
import { selectIssue, selectAction } from "./ui";
import { LinearIssue } from "./schema";
config();

async function main() {
  try {
    console.log("Fetching issues...");
    let issues: LinearIssue[];
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

// npx tsx src/linear_cli.ts
// or
// npm run dev
main().then(() => console.log("done"));
