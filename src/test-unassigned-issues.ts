import { getIssues } from "./linear";

async function main() {
  console.log("Fetching unassigned open issues from Current team...\n");

  const issues = await getIssues(
    false, // onlyMine
    undefined, // projectId
    false, // includeClosed
    true // onlyUnassigned
  );

  console.log(`Found ${issues.length} unassigned open issues:\n`);

  for (const issue of issues) {
    console.log(
      `- [${issue.team.key}] ${issue.branchName.split("/")[1] || issue.branchName}`
    );
    console.log(`  Title: ${issue.title}`);
    console.log(`  Status: ${issue.state.name} (${issue.state.type})`);
    console.log(`  Assignee: ${issue.assignee?.name ?? "UNASSIGNED"}`);
    console.log();
  }
}

// npx tsx src/test-unassigned-issues.ts
main();
