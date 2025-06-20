import { type LinearIssue, linearProjectSchema, Action } from "./schema";
import {
  bold,
  blue,
  underline,
  secondaryColors,
  noColor,
  getSlug,
  isNotNullOrUndefined,
  showNumberOfDaysAgo,
  copyToClipboard,
  openInBrowser,
  ZERO_WIDTH_SPACE,
} from "./utils";
import { getUserSelection, defaultFzfArgs } from "fzf-ts";
import { actions } from "./schema";
import { z } from "zod";

export type LinearProject = z.infer<typeof linearProjectSchema>;

export const previewIssue = (
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
    [
      issue.state.stateIcon,
      blue(bold(issue.title)),
      issue.estimate ? `(${issue.estimate})` : null,
    ]
      .filter(isNotNullOrUndefined)
      .join(" - "),
    issue.creator?.displayName
      ? `Created by ${issue.creator?.displayName ?? "Unknown"} ${new Date(
          issue.createdAt
        ).toLocaleString()}`
      : null,
    issue.updatedAt ? `Updated ${showNumberOfDaysAgo(issue.updatedAt)}` : null,
    bold(issue.branchName),
    bold(issue.url ?? ""),
    "\n",
    issue.description ?? "",
  ]
    .filter(isNotNullOrUndefined)
    .join("\n");
};

export const displayIssue = (
  issue: LinearIssue,
  teamColors: Map<string, (text: string) => string>,
  teamProjectSlugs: Map<string | undefined, string>
) => {
  const teamColor = teamColors.get(issue.team.key) ?? noColor;
  const projectSlug = teamProjectSlugs.get(issue.project?.id ?? "");
  const numberDaysAgoUpdatedMessage = issue.updatedAt
    ? ` (${showNumberOfDaysAgo(issue.updatedAt)})`
    : "";
  const metadataPrefix = [
    issue.assignee?.displayName ?? "UNASSIGNED",
    issue.team.key,
    projectSlug,
  ]
    .filter(isNotNullOrUndefined)
    .map((item) => teamColor(item))
    .join(" - ");
  return `${issue.state.stateIcon}[${metadataPrefix}] ${
    issue.estimate ? `${ZERO_WIDTH_SPACE}(${issue.estimate}) ` : ""
  }${blue(issue.title)}${numberDaysAgoUpdatedMessage}`;
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
    .map((issue) => displayIssue(issue, teamColors, teamProjectSlugs))
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
          `(${projectIssues.length} issue${
            projectIssues.length === 1 ? "" : "s"
          }${updatedString})`,
        ].join(" - "),
        fullItem: project,
      };
    }),
    getPreview: async (item) => {
      const projectIssues = projectIssuesMap.get(item.fullItem.id) || [];
      if (projectIssues.length === 0) {
        return `${bold(item.fullItem.name)}\n\nNo issues in this project`;
      }
      return [bold(item.fullItem.name), renderIssueList(projectIssues)].join(
        "\n\n"
      );
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
      display: displayIssue(issue, teamColors, teamProjectSlugs),
      fullItem: issue,
    })),
    getPreview: async (item) => {
      return previewIssue(item.fullItem, teamColors, teamProjectSlugs);
    },
    fzfArgs: [...defaultFzfArgs, "--preview-window=right:30%"],
  });
  return selection;
}

export async function selectAction(
  selection: LinearIssue,
  alreadyDoneActions: Set<Action>
) {
  const action = await getUserSelection({
    items: actions.map((action) => {
      const alreadyDoneBadge = alreadyDoneActions.has(action) ? "✅" : "";
      switch (action) {
        case "copy-branch-name":
          return {
            id: action,
            display: `${alreadyDoneBadge}Copy branch name (${selection.branchName})`,
          };
        case "open-in-browser":
          return {
            id: action,
            display: `${alreadyDoneBadge}Open in browser (${selection.url})`,
          };
        case "copy-issue-url":
          return {
            id: action,
            display: `${alreadyDoneBadge}Copy issue URL (${selection.url})`,
          };
        case "copy-issue-description-markdown":
          return {
            id: action,
            display: `${alreadyDoneBadge}Copy issue description as markdown`,
          };
      }
    }),
    getPreview: undefined,
    fzfArgs: [...defaultFzfArgs, "--header=Select an action (ctrl-c to exit)"],
  });
  return action?.id ?? null;
}

export async function selectAndTakeAction(
  selectedIssue: LinearIssue,
  alreadyDoneActions: Set<Action>
): Promise<Action | null> {
  const action = await selectAction(selectedIssue, alreadyDoneActions);
  if (!action) {
    console.log("No action selected");
    return null;
  }
  switch (action) {
    case "copy-branch-name":
      copyToClipboard(selectedIssue.branchName);
      console.log(
        `Copied branch name to clipboard (${selectedIssue.branchName})`
      );
      break;
    case "open-in-browser":
      openInBrowser(selectedIssue.url);
      console.log(`Opened in browser (${selectedIssue.url})`);
      break;
    case "copy-issue-url":
      copyToClipboard(selectedIssue.url);
      console.log(`Copied issue URL to clipboard (${selectedIssue.url})`);
      break;
    case "copy-issue-description-markdown":
      const teamProjectSlugs = new Map([
        [selectedIssue.project?.id, getSlug(selectedIssue.project?.name)],
      ]);
      if (!selectedIssue.description) {
        console.log("No description found for issue");
        return null;
      }
      copyToClipboard(selectedIssue.description);
      console.log("Copied issue description as markdown to clipboard");
      console.log(`${selectedIssue.description.slice(0, 100)}...`);
      break;
  }
  return action;
}

export async function selectAndTakeActionLoop(
  selectedIssue: LinearIssue,
  looping: boolean
) {
  const doneActions = new Set<Action>();
  while (true) {
    const action = await selectAndTakeAction(selectedIssue, doneActions);
    if (!looping || !action) {
      break;
    }
    doneActions.add(action);
  }
  return Array.from(doneActions);
}
