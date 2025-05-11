import { config } from "dotenv";
import { copyToClipboard, openInBrowser } from "./utils";
import { selectIssue, selectAction } from "./ui";
import { issues } from "./demo.mock";
config();

async function main() {
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
      console.log(`Copied issue URL to clipboard (${selection.fullItem.url})`);
      break;
  }
}

// npx tsx src/linear_cli.ts
// or
// npm run dev
main().then(() => console.log("done"));
