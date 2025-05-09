import { LinearClient, Issue } from "@linear/sdk";

import { linearIssueResponseSchema } from "./schema";

export async function getIssue(issueId: string) {
  const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY,
  });
  const issue = await linearClient.issue(issueId);
  return issue;
}

export async function getIssues() {
  const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY,
  });
  const linearGraphQLClient = linearClient.client;
  const issues = await linearGraphQLClient.rawRequest(`
    query Me { 
        issues(orderBy: updatedAt) { 
            nodes { 
                id 
                title 
                updatedAt
                description
                branchName
                createdAt
                updatedAt
                team {
                    name
                    displayName
                    id
                    key
                    inviteHash
                }
                state {
                    name
                    type
                }
                startedAt
                creator {
                    name
                    email
                    displayName
                }
                dueDate
                cycle {
                    name
                    team {
                        name
                        displayName
                        id
                        key
                        inviteHash
                    }
                }
                dueDate
                estimate
                priority
                priorityLabel
                assignee { 
                    name 
                    displayName
                    email
                } 
            } 
        } 
    }
  `);
  return linearIssueResponseSchema.parse(issues).data.issues.nodes;
}

const getIssuesDirect = async () => {
  const enrichIssue = async (issue: Issue) => {
    const assignee = await issue.assignee;
    const team = await issue.team;
  };
  const linearClient = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY,
  });
  const issues = await linearClient.issues();
  issues.nodes.forEach(enrichIssue);
  return issues;
};
