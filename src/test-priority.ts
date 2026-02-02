import { LinearClient } from "@linear/sdk";
import { getOrSetToken } from "./token-cache";

async function testPriority() {
  const tokenResponse = await getOrSetToken();
  const token = tokenResponse.access_token;
  if (!token) {
    console.log("No token found");
    return;
  }
  const client = new LinearClient({ accessToken: token });
  const issues = await client.issues({
    first: 10,
    filter: { assignee: { isMe: { eq: true } } },
  });

  console.log("Priority values from Linear API:");
  console.log("================================");
  for (const issue of issues.nodes) {
    console.log(
      `${issue.identifier}: priority=${issue.priority}, priorityLabel="${issue.priorityLabel}"`,
    );
  }
}

testPriority();
