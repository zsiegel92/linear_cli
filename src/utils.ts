import { exec } from "child_process";

export function copyToClipboard(text: string) {
  return exec(`echo ${text} | pbcopy`);
}

export function openInBrowser(url: string) {
  return exec(`open ${url}`);
}
