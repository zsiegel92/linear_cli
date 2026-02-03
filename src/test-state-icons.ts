import { getIssues } from "./linear";

async function main() {
  const issues = await getIssues(false, undefined, false);
  const seen = new Set<string>();
  for (const issue of issues) {
    const key = `${issue.state.name}|${issue.state.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      console.log(
        `${issue.state.stateIcon} "${issue.state.name}" (type: ${issue.state.type})`,
      );
    }
  }
}

// npx tsx src/test-state-icons.ts
main();
