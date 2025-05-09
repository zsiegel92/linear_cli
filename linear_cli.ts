import { LinearClient, LinearFetch, User } from "@linear/sdk";
import { config } from "dotenv";
import { getUserSelections } from "./fzf-selection";

config();

async function main() {
  console.log(process.env.LINEAR_API_KEY);
  const selections = await getUserSelections({
    items: [
      { id: "1", display: "Hello" },
      { id: "2", display: "World" },
    ],
    getPreview: async (item, nTimesUpdates) => {
      const preview = item
        ? `\x1b[1m${item.display}\x1b[0m\n\n• id: ${item.id}\n\n# add any rich preview here\nUpdated ${nTimesUpdates} times`
        : "";
      return preview;
    },
  });
  console.log(selections);
}
// npx tsx --env-file .env linear_cli.ts
main().then(() => console.log("done"));
