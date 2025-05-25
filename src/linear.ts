import { LinearClient, Issue } from "@linear/sdk";
import {
  linearIssueResponseSchema,
  linearProjectSchema,
  type LinearAuth,
} from "./schema";
import { z } from "zod";

function getAuth(): LinearAuth {
  if (process.env.LINEAR_OAUTH_TOKEN) {
    console.log("Using OAuth token");
    return {
      accessToken: process.env.LINEAR_OAUTH_TOKEN,
    };
  }
  if (process.env.LINEAR_API_KEY) {
    console.log("Using API key");
    return {
      apiKey: process.env.LINEAR_API_KEY,
    };
  }
  throw new Error("No Linear API key or OAuth token found");
}

export async function getIssue(issueId: string) {
  const auth = getAuth();
  const linearClient = new LinearClient(auth);
  const issue = await linearClient.issue(issueId);
  return issue;
}

export async function getIssues(
  onlyMine: boolean = false,
  projectId: string | undefined = undefined
) {
  const auth = getAuth();
  const linearClient = new LinearClient(auth);
  const linearGraphQLClient = linearClient.client;

  // Build filter object
  let filterArgs = "orderBy: updatedAt, first: 80";
  const filterParts = [];

  if (onlyMine) {
    const me = await linearClient.viewer;
    filterParts.push(`assignee: { id: { eq: "${me.id}" } }`);
  }
  if (projectId) {
    filterParts.push(`project: { id: { eq: "${projectId}" } }`);
  }
  if (filterParts.length > 0) {
    filterArgs += `, filter: { ${filterParts.join(", ")} }`;
  }

  const query = `
    query Me { 
        issues(${filterArgs}) {
            nodes { 
                id 
                title 
                description
                branchName
                createdAt
                updatedAt
                url
                team {
                    name
                    displayName
                    key
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
                project {
                    name
                    color
                    slugId
                    id
                }
            } 
        } 
    }
  `;

  const issues = await linearGraphQLClient.rawRequest(query);
  return linearIssueResponseSchema.parse(issues).data.issues.nodes;
}

export async function getProjects() {
  const auth = getAuth();
  const linearClient = new LinearClient(auth);
  const linearGraphQLClient = linearClient.client;

  const projects = await linearGraphQLClient.rawRequest(`
    query GetProjects { 
        projects(first: 100) {
            nodes { 
                id
                name
                color
                slugId
            } 
        } 
    }
  `);

  const projectResponseSchema = z.object({
    data: z.object({
      projects: z.object({
        nodes: z.array(linearProjectSchema),
      }),
    }),
  });

  return projectResponseSchema.parse(projects).data.projects.nodes;
}

const getIssuesDirect = async () => {
  const auth = getAuth();
  const enrichIssue = async (issue: Issue) => {
    const assignee = await issue.assignee;
    const team = await issue.team;
    const project = await issue.project;
  };
  const linearClient = new LinearClient(auth);
  const issues = await linearClient.issues();
  issues.nodes.forEach(enrichIssue);
  return issues;
};
