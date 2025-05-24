import { config } from "dotenv";
import { checkIfFzfIsInstalled } from "fzf-ts";
import { getIssues, getProjects } from "./linear";
import { copyToClipboard, openInBrowser } from "./utils";
import { selectIssue, selectAction, selectProject } from "./ui";
import { LinearIssue } from "./schema";
import minimist from "minimist";
config();

async function main() {
  const args = minimist(process.argv.slice(2), {
    alias: {
      h: "help",
      m: "me",
      p: "projects",
    },
    boolean: ["help", "me", "projects"],
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
    let issues: LinearIssue[];
    let projectId: string | undefined;
    if (args.projects) {
      console.log("Fetching projects...");
      const [projects, issues] = await Promise.all([
        getProjects(),
        getIssues(false, undefined),
      ]);
      console.log("Fetching issues for project preview...");
      const projectSelection = await selectProject(projects, issues);
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

// npx tsx src/linear_cli.ts
// or
// npm run dev
main().then(() => console.log("done"));
