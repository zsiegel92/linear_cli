import { type LinearIssue } from "./schema";
import {
  bold,
  blue,
  underline,
  secondaryColors,
  noColor,
  getSlug,
  isNotNullOrUndefined,
} from "./utils";
import { getUserSelections } from "./fzf-selection";
import { actions } from "./schema";

export const previewItem = (
  issue: LinearIssue,
  teamColors: Map<string, (text: string) => string>,
  teamProjectSlugs: Map<string | undefined, string>
) => {
  const teamColor = teamColors.get(issue.team.key) ?? noColor;
  const projectSlug = teamProjectSlugs.get(issue.project?.id ?? "");
  return [
    [underline(bold(issue.project?.name ?? "")), `(${projectSlug})`]
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
    issues.map((issue) => [
      issue.project?.id,
      getSlug(issue.project?.name ?? ""),
    ])
  );
  return teamProjectSlugs;
};

export async function selectIssue(issues: LinearIssue[]) {
  const teamColors = getTeamColors(issues);
  const teamProjectSlugs = getTeamProjectSlugs(issues);
  const selection = await getUserSelections({
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
  const action = await getUserSelections({
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
