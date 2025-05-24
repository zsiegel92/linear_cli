import { type LinearIssue, linearProjectSchema } from "./schema";
import {
  bold,
  blue,
  underline,
  secondaryColors,
  noColor,
  getSlug,
  isNotNullOrUndefined,
} from "./utils";
import { getUserSelection } from "fzf-ts";
import { actions } from "./schema";
import { z } from "zod";

export type LinearProject = z.infer<typeof linearProjectSchema>;

export const previewItem = (
  issue: LinearIssue,
  teamColors: Map<string, (text: string) => string>,
  teamProjectSlugs: Map<string | undefined, string>
) => {
  const teamColor = teamColors.get(issue.team.key) ?? noColor;
  const projectSlug = teamProjectSlugs.get(issue.project?.id ?? "");
  return [
    [
      underline(
        bold(issue.project?.name ?? "<No Project Specified For Issue>")
      ),
      projectSlug ? `(${projectSlug})` : null,
    ]
      .filter(isNotNullOrUndefined)
      .map((item) => teamColor(item))
      .join(" - "),
    [blue(bold(issue.title)), issue.estimate ? `(${issue.estimate})` : null]
      .filter(isNotNullOrUndefined)
      .join(" - "),
    issue.creator?.displayName
      ? `Created by ${issue.creator?.displayName ?? "Unknown"} ${new Date(
          issue.createdAt
        ).toLocaleString()}`
      : null,
    bold(issue.branchName),
    bold(issue.url ?? ""),
    "\n",
    issue.description ?? "",
  ]
    .filter(isNotNullOrUndefined)
    .join("\n");
};

export const displayItem = (
  issue: LinearIssue,
  teamColors: Map<string, (text: string) => string>,
  teamProjectSlugs: Map<string | undefined, string>
) => {
  const teamColor = teamColors.get(issue.team.key) ?? noColor;
  const projectSlug = teamProjectSlugs.get(issue.project?.id ?? "");
  return `[${[
    issue.assignee?.displayName ?? "UNASSIGNED",
    issue.team.key,
    projectSlug,
  ]
    .filter(isNotNullOrUndefined)
    .map((item) => teamColor(item))
    .join(" - ")}]  ${issue.estimate ? `(${issue.estimate}) ` : ""}${blue(
    issue.title
  )}`;
};

export const getTeamColors = (
  issues: LinearIssue[]
): Map<string, (text: string) => string> => {
  const teamColors = new Map(
    [...new Set(issues.map((issue) => issue.team.key))].map(
      (teamKey, index) => [
        teamKey,
        secondaryColors[index % secondaryColors.length],
      ]
    )
  );
  return teamColors;
};

export const getTeamProjectSlugs = (
  issues: LinearIssue[]
): Map<string | undefined, string> => {
  const teamProjectSlugs = new Map(
    issues.map((issue) => [issue.project?.id, getSlug(issue.project?.name)])
  );
  return teamProjectSlugs;
};

export const renderIssueList = (issues: LinearIssue[]): string => {
  const teamColors = getTeamColors(issues);
  const teamProjectSlugs = getTeamProjectSlugs(issues);

  return issues
    .map((issue) => displayItem(issue, teamColors, teamProjectSlugs))
    .join("\n");
};

export async function selectProject(
  projects: LinearProject[],
  issues: LinearIssue[]
) {
  const projectIssuesMap = new Map<string, LinearIssue[]>();

  projects.forEach((project) => {
    projectIssuesMap.set(project.id, []);
  });
  issues.forEach((issue) => {
    if (issue.project?.id) {
      const projectIssues = projectIssuesMap.get(issue.project.id) || [];
      projectIssues.push(issue);
      projectIssuesMap.set(issue.project.id, projectIssues);
    }
  });
  const selection = await getUserSelection({
    items: projects.map((project) => {
      const projectIssues = projectIssuesMap.get(project.id) || [];
      const lastUpdated =
        projectIssues.length > 0 ? new Date(projectIssues[0].updatedAt) : null;
      const updatedString = lastUpdated
        ? ` updated ${new Date(lastUpdated).toLocaleDateString()}`
        : "";
      return {
        id: project.id,
        display: [
          blue(project.name),
          `(${projectIssues.length} issue${projectIssues.length===1? '': 's'}${updatedString})`,
        ].join(" - "),
        fullItem: project,
      };
    }),
    getPreview: async (item) => {
      const projectIssues = projectIssuesMap.get(item.fullItem.id) || [];
      if (projectIssues.length === 0) {
        return `${bold(item.fullItem.name)}\n\nNo issues in this project`;
      }
      return `${bold(item.fullItem.name)}\n\n${renderIssueList(projectIssues)}`;
    },
  });

  return selection;
}

export async function selectIssue(issues: LinearIssue[]) {
  const teamColors = getTeamColors(issues);
  const teamProjectSlugs = getTeamProjectSlugs(issues);
  const selection = await getUserSelection({
    items: issues.map((issue) => ({
      id: issue.id,
      display: displayItem(issue, teamColors, teamProjectSlugs),
      fullItem: issue,
    })),
    getPreview: async (item) => {
      return previewItem(item.fullItem, teamColors, teamProjectSlugs);
    },
  });
  return selection;
}

export async function selectAction(selection: LinearIssue) {
  const action = await getUserSelection({
    items: actions.map((action) => {
      switch (action) {
        case "copy-branch-name":
          return {
            id: action,
            display: `Copy branch name (${selection.branchName})`,
          };
        case "open-in-browser":
          return {
            id: action,
            display: `Open in browser (${selection.url})`,
          };
        case "copy-issue-url":
          return {
            id: action,
            display: `Copy issue URL (${selection.url})`,
          };
      }
    }),
    getPreview: undefined,
  });
  return action?.id ?? null;
}
