import { exec } from "child_process";

export function copyToClipboard(text: string) {
  return exec(`echo ${text} | pbcopy`);
}

export function openInBrowser(url: string) {
  return exec(`open ${url}`);
}

export function bold(text: string) {
  return `\x1b[1m${text}\x1b[0m`;
}

export function italic(text: string) {
  return `\x1b[3m${text}\x1b[0m`;
}

export function underline(text: string) {
  return `\x1b[4m${text}\x1b[0m`;
}

export function red(text: string) {
  return `\x1b[31m${text}\x1b[0m`;
}

export function green(text: string) {
  return `\x1b[32m${text}\x1b[0m`;
}
export function blue(text: string) {
  return `\x1b[34m${text}\x1b[0m`;
}

export function yellow(text: string) {
  return `\x1b[33m${text}\x1b[0m`;
}

export function cyan(text: string) {
  return `\x1b[36m${text}\x1b[0m`;
}

export function magenta(text: string) {
  return `\x1b[35m${text}\x1b[0m`;
}

export function noColor(text: string) {
  return text;
}

export const colors = [red, green, blue, yellow, cyan, magenta];
export const primaryColors = [red, green, blue];
export const secondaryColors = [yellow, cyan, magenta];

export function getSlug(text: string) {
  // Transforms "My Project" to "MP"
  // Transforms "My Project: Doing things, Doing thing 1" to "MPDtDt1"
  return text
    .split(":")
    .map((part) =>
      part
        .trim()
        .split(" ")
        .map((word) => word[0])
        .join("")
    )
    .join("");
}

export function isNotNullOrUndefined<T>(
  value: T | null | undefined
): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function rightPad(text: string, length: number) {
  return text.padEnd(length, " ");
}
