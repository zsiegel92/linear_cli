import { getProjects, getIssues } from "./linear";

async function main() {
  await getProjects()
    .then((projects) => {
      console.log("Projects:", projects);
    })
    .catch((err) => {
      console.error("Error getting projects:", err);
    });
  getIssues(false, undefined, false).then((issues) => {
    console.log("Issues:", issues);
  });
}

// npx tsx src/test-get-projects.ts
main();
