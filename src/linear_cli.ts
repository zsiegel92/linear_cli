import { checkIfFzfIsInstalled } from "fzf-ts";
import { getIssues, getProjects } from "./linear";
import { selectIssue, selectProject, selectAndTakeActionLoop } from "./ui";
import type { LinearIssue } from "./schema";
import minimist from "minimist";

async function main() {
  const args = minimist(process.argv.slice(2), {
    alias: {
      h: "help",
      m: "me",
      p: "projects",
      l: "loop",
    },
    boolean: ["help", "me", "projects", "loop"],
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

// npx tsx src/linear_cli.ts
// or
// npm run dev
main().then(() => console.log("done"));
