import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { LinearClient, LinearFetch, User } from "@linear/sdk";

interface FzfSelection {
  display: string;
  id: string;
}
async function getTempFilePath(prefix = "myapp-"): Promise<string> {
  const tempDir = await fs.mkdtemp(join(tmpdir(), prefix));
  return join(tempDir, "somefile.tmp");
}
async function getUserSelections<T extends FzfSelection>({
  items,
  fzfArgs = [
    "--cycle",
    "--no-sort",
    "--bind",
    // let the user scroll the preview with Alt-↑/↓/u/d
    "alt-up:preview-up,alt-down:preview-down,alt-u:preview-page-up,alt-d:preview-page-down",
  ],
  getPreview,
}: {
  items: T[];
  fzfArgs?: string[];
  getPreview: (item: T, nTimesUpdates: number) => Promise<string>;
}): Promise<T[]> {
  if (!items.length) return [];

  // ── 1.  Two temp files ────────────────────────────────────────────────
  const tmpSel = await getTempFilePath(); // fzf → TS   (one-line file containing the hovered id)
  const tmpPrev = await getTempFilePath(); // TS  → fzf  (arbitrary multiline preview)

  // create the files so `cat` has something to read the first time
  await Promise.all([fs.writeFile(tmpSel, ""), fs.writeFile(tmpPrev, "")]);

  let nTimesUpdates = 0;
  let locked = false;
  // ── 2.  Kick off the preview-render loop  ─────────────────────────────
  const monitor = setInterval(async () => {
    if (locked) return;
    // locked = true
    try {
      const hovered = (await fs.readFile(tmpSel, "utf8")).trim();
      if (hovered) {
        // find the matching item
        const item = items.find((i) => i.id === hovered);
        if (!item) return;
        nTimesUpdates++;
        const preview = await getPreview(item, nTimesUpdates);
        // wait 2s
        // await new Promise((resolve) => setTimeout(resolve, 2000))
        await fs.writeFile(tmpPrev, preview);
        // wipe the request so we don’t re-render the same thing
        await fs.writeFile(tmpSel, "");
        // locked = false
      }
    } catch {
      //   locked = false
      /* ignore EBUSY/ENOENT etc. – fzf may still be opening the file */
    }
  }, 10); // 10 ms feels instant but is still lightweight

  // ── 3.  Build the preview command for fzf  ────────────────────────────
  //
  // `fzf` replaces {1} with the *first* field of the line under the cursor
  // and then runs the whole string in $SHELL.  We write that id to tmpSel
  // and immediately cat whatever TS has put in tmpPrev.
  //
  //   $1  == positional parameter passed after the dash-dash.
  //   --  tells bash “everything after this is $0 $1 $2…”.
  //
  //   const previewCmd = `bash -c 'echo "$1" > "${tmpSel}" ; cat "${tmpPrev}"' -- {1}`
  const previewCmd = [
    `SEL="${tmpSel}"`,
    `PREV="${tmpPrev}"`,
    `bash -c '`,
    `  echo "$1" > "$SEL";`,
    `  while [[ -s "$SEL" ]]; do sleep 0.01; done;`,
    `  cat "$PREV"`,
    `' -- {1}`,
  ].join(" ");

  // ── 4.  Spawn fzf  ────────────────────────────────────────────────────
  const args = [
    ...fzfArgs,
    "--delimiter= ",
    "--with-nth=2..", // show only the ‘display’ column in the list
    "--preview",
    previewCmd,
  ];

  const child = spawn("fzf", args, {
    stdio: ["pipe", "pipe", "inherit"],
  });

  // stream the list:  “id display”
  child.stdin.write(items.map((i) => `${i.id} ${i.display}`).join("\n"));
  child.stdin.end();

  // ── 5.  Gather the chosen lines (user hits Enter)  ────────────────────
  let out = "";
  for await (const chunk of child.stdout) out += chunk;
  const code = await new Promise<number>((r) => child.on("close", r));
  clearInterval(monitor);

  if (code === 1 || code === 130) return []; // cancel / ESC
  if (code !== 0) throw new Error(`fzf exited with ${code}`);

  const chosenIds = out
    .trim()
    .split("\n")
    .map((l) => l.split(" ")[0]);
  return items.filter((i) => chosenIds.includes(i.id));
}

async function main() {
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

main().then(() => console.log("done"));
