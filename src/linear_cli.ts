import { checkIfFzfIsInstalled } from "fzf-ts";
import { getIssues, getProjects } from "./linear";
import { selectIssue, selectProject, selectAndTakeActionLoop } from "./ui";
import type { LinearIssue } from "./schema";
import minimist from "minimist";

// Split priority digits out of combined short flags so `-ut2` → `-ut -2`
function preprocessArgs(argv: string[]): string[] {
  const result: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("-") && !arg.startsWith("--")) {
      const letters = arg.slice(1).replace(/[1-4]/g, "");
      const digits = [...new Set(arg.slice(1).match(/[1-4]/g) || [])];
      if (letters) result.push(`-${letters}`);
      for (const d of digits) result.push(`-${d}`);
      if (!letters && digits.length === 0) result.push(arg);
    } else {
      result.push(arg);
    }
  }
  return result;
}

async function main() {
  const args = minimist(preprocessArgs(process.argv.slice(2)), {
    alias: {
      h: "help",
      m: "me",
      p: "projects",
      l: "loop",
      a: "all",
      u: "unassigned",
      t: "triaged",
    },
    boolean: [
      "help",
      "me",
      "projects",
      "loop",
      "all",
      "unassigned",
      "triaged",
      "1",
      "2",
      "3",
      "4",
    ],
  });

  // Priority filter: -1 = Urgent only, -2 = Urgent+High, -3 = +Normal, -4 = +Low (everything with priority)
  const maxPriority = [4, 3, 2, 1].find((n) => args[n]) ?? 0;

  if (args.help) {
    console.log(`Linear CLI - Select and interact with Linear issues

Usage: linear-cli [options]

Options:
  -h, --help        Show this help message
  -m, --me          Show only issues assigned to you
  -p, --projects    Select a project first, then show issues from that project
  -l, --loop        Loop action selector (to copy branch name and open in browser, etc.)
  -a, --all         Show all issues, including closed ones
  -u, --unassigned  Show only unassigned open issues (excludes In Progress, In Code Review, etc.)
  -t, --triaged     Show only triaged issues (excludes triage status)
  -1                Priority filter: Urgent only
  -2                Priority filter: Urgent + High
  -3                Priority filter: Urgent + High + Normal
  -4                Priority filter: anything with a priority set
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
        getIssues(false, undefined, args.all),
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
      issues = await getIssues(
        args.me,
        projectId,
        args.all,
        args.unassigned,
        args.triaged,
        maxPriority,
      );
    } catch (err) {
      console.error("Error connecting to Linear API");
      return;
    }
    console.log(`Found ${issues.length} issues`);

    // Main loop: select issue -> select actions -> back to issues
    while (true) {
      const selection = await selectIssue(issues);
      if (!selection) {
        console.log("Exiting");
        return;
      }

      const doneActions = await selectAndTakeActionLoop(
        selection.fullItem,
        args.loop,
      );
      if (doneActions.length > 0) {
        console.log(`Done actions: ${doneActions.join(", ")}`);
      }
      // Loop back to issue selection
    }
  } catch (err) {
    if (!process.env.LINEAR_API_KEY) {
      throw new Error(
        `LINEAR_API_KEY is not set! Define in ~/.zshrc with
        \`export LINEAR_API_KEY='<your-api-key>'\`
        or something similar.
        
        Create a key at https://linear.app/current-ai/settings/account/security`,
      );
    }
    const fzfInstalled = await checkIfFzfIsInstalled();
    if (!fzfInstalled) {
      throw new Error(
        "fzf is not installed! Install it with `brew install fzf`",
      );
    }
    throw err;
  }
}

// npx tsx src/linear_cli.ts
// or
// npm run dev
main().then(() => console.log("done"));
