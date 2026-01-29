import { LinearClient } from "@linear/sdk";
import { getOrSetToken } from "./token-cache";

async function main() {
  const authResponse = await getOrSetToken();
  const linearClient = new LinearClient({
    accessToken: authResponse.access_token,
  });

  const states = await linearClient.workflowStates();
  console.log("\n=== Workflow States ===\n");
  for (const state of states.nodes) {
    console.log(
      `Name: "${state.name}" | Type: "${state.type}" | Color: ${state.color}`,
    );
  }
}

// npx tsx src/test-workflow-states.ts
main();
