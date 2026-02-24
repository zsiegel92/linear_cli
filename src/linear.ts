import {
  linearIssueResponseSchema,
  linearProjectSchema,
  type LinearAuth,
} from "./schema";
import { LinearClient } from "@linear/sdk";
import { z } from "zod";
import { getOrSetToken } from "./token-cache";

let _clientSingleton: LinearClient;

async function getAuth(): Promise<LinearAuth> {
  if (process.env.LINEAR_OAUTH_TOKEN) {
    console.error("Using OAuth token");
    return {
      accessToken: process.env.LINEAR_OAUTH_TOKEN,
    };
  }
  if (process.env.LINEAR_API_KEY) {
    console.error("Using API key");
    return {
      apiKey: process.env.LINEAR_API_KEY,
    };
  }
  console.error("Getting OAuth token");
  const authResponse = await getOrSetToken();
  return {
    accessToken: authResponse.access_token,
  };
}

async function getAuthenticatedClient() {
  if (_clientSingleton) {
    return _clientSingleton;
  }
  const auth = await getAuth();
  const linearClient = new LinearClient(auth);
  _clientSingleton = linearClient;
  return linearClient;
}
export async function getIssue(issueId: string) {
  const linearClient = await getAuthenticatedClient();
  const issue = await linearClient.issue(issueId);
  return issue;
}

const STATUS_NAMES_THAT_ARE_NOT_UNASSIGNED = [
  "In Product Acceptance",
  "In Code Review",
  "In Progress",
  "Done",
  "Canceled",
  "Duplicate",
];

export async function getIssues(
  onlyMine: boolean = false,
  projectId: string | undefined = undefined,
  includeClosed: boolean = false,
  onlyUnassigned: boolean = false,
  onlyTriaged: boolean = false,
  maxPriority: number = 0,
) {
  const linearClient = await getAuthenticatedClient();
  const linearGraphQLClient = linearClient.client;

  // Build filter object
  let filterArgs = "orderBy: updatedAt, first: 80";
  const filterParts = [];

  if (onlyMine) {
    const me = await linearClient.viewer;
    filterParts.push(`assignee: { id: { eq: "${me.id}" } }`);
  }
  if (onlyUnassigned) {
    filterParts.push(`assignee: { null: true }`);
    const stateFilter = `name: { nin: ${JSON.stringify(STATUS_NAMES_THAT_ARE_NOT_UNASSIGNED)} }`;
    if (onlyTriaged) {
      filterParts.push(`state: { ${stateFilter}, type: { nin: ["triage"] } }`);
    } else {
      filterParts.push(`state: { ${stateFilter} }`);
    }
  }
  if (maxPriority > 0) {
    filterParts.push(`priority: { lte: ${maxPriority}, gte: 1 }`);
  }
  if (projectId) {
    filterParts.push(`project: { id: { eq: "${projectId}" } }`);
  }
  if (!includeClosed && !onlyUnassigned) {
    const excludedTypes = ["completed", "canceled"];
    if (onlyTriaged) {
      excludedTypes.push("triage");
    }
    filterParts.push(
      `state: { type: { nin: ${JSON.stringify(excludedTypes)} } }`,
    );
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
  const linearClient = await getAuthenticatedClient();
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
