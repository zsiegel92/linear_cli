import { exec } from "child_process";

export function copyToClipboard(text: string) {
  return exec(`echo "${text}" | pbcopy`);
}

export function openInBrowser(url: string) {
  return exec(`open "${url}"`);
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

export function hexColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

export const colors = [red, green, blue, yellow, cyan, magenta];
export const primaryColors = [red, green, blue];
export const secondaryColors = [yellow, cyan, magenta];

// Transforms "My Project" to "MP"
// Transforms "My Project: Doing things, Doing thing 1" to "MPDtDt1"
// Transforms "Plans - Cool Things (Also Weird & Cool)" to "P-CT(AW&C)"
// Preserves special characters: "My Project (C&C)" to "MP(C&C)"
const PRESERVED = ":()[]{}-&";

export function getSlug(text?: string): string {
  const preservedSet = new Set(PRESERVED);
  if (!text) return "";

  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      let haveNonPreservedChar = false;
      let accepted: string[] = [];
      for (const char of word) {
        if (preservedSet.has(char)) {
          accepted.push(char);
        } else if (!haveNonPreservedChar) {
          haveNonPreservedChar = true;
          accepted.push(char);
        }
      }
      return accepted.join("");
    })
    .join("");
}

export function isNotNullOrUndefined<T>(
  value: T | null | undefined,
): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function rightPad(text: string, length: number) {
  return text.padEnd(length, " ");
}

export function formatIsoDateString(dateString: string): string | null {
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch (e) {
    return null;
  }
}

export function showNumberOfDaysAgo(dateString: string): string | null {
  try {
    const date = new Date(dateString);
    const daysAgo = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
  } catch (e) {
    return null;
  }
}

export const ZERO_WIDTH_SPACE = "\u200B"; // Useful if ansi escapes are next to brackets, which `bat` can render incorrectly.
