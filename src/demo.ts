import { selectIssue,  selectAndTakeActionLoop } from "./ui";
import { issues } from "./demo.mock";

async function main() {
  console.log(`Found ${issues.length} issues`);
  const selection = await selectIssue(issues);
  if (!selection) {
    console.log("No issue selected");
    return;
  }
  const doneActions = await selectAndTakeActionLoop(selection.fullItem, true);
  console.log(`Done actions: ${doneActions.join(", ")}`);
}

// npm run demo
main().then(() => console.log("done"));
