import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { FileCopyInfo } from "./types.js";

// ANSI Terminal Colors
export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgCyan: "\x1b[46m",
  bgBlue: "\x1b[44m",
};

export const c = {
  bold: (text: string | number) => `${colors.bold}${text}${colors.reset}`,
  dim: (text: string | number) => `${colors.dim}${text}${colors.reset}`,
  cyan: (text: string | number) => `${colors.cyan}${text}${colors.reset}`,
  green: (text: string | number) => `${colors.green}${text}${colors.reset}`,
  yellow: (text: string | number) => `${colors.yellow}${text}${colors.reset}`,
  red: (text: string | number) => `${colors.red}${text}${colors.reset}`,
  magenta: (text: string | number) => `${colors.magenta}${text}${colors.reset}`,
  blue: (text: string | number) => `${colors.blue}${text}${colors.reset}`,
  white: (text: string | number) => `${colors.white}${text}${colors.reset}`,
  gray: (text: string | number) => `${colors.gray}${text}${colors.reset}`,
};

/**
 * Format a Date object to 'YYYY-MM-DD' ISO date string using local timezone.
 */
export function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a 'YYYY-MM-DD' ISO string into a local Date object.
 */
export function parseDateIso(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match || !match[1] || !match[2] || !match[3]) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const date = new Date(year, month, day, 12, 0, 0);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Add or subtract days from a Date object.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Validates whether string is in YYYY-MM-DD format.
 */
export function isValidIsoDate(str: string): boolean {
  return parseDateIso(str) !== null;
}

/**
 * Resolve relative or tilde path against base directory (defaulting to console_control root).
 */
export function resolvePath(targetPath: string, basePath?: string): string {
  if (targetPath.startsWith("~")) {
    return path.resolve(os.homedir(), targetPath.slice(1).replace(/^[/\\]/, ""));
  }
  if (path.isAbsolute(targetPath)) {
    return path.resolve(targetPath);
  }
  const base = basePath ?? path.resolve(import.meta.dir, "..");
  return path.resolve(base, targetPath);
}

/**
 * Recursively search for all .md files in a directory (like Path.rglob("*.md") in Python).
 */
export function getMdFiles(dirPath: string): FileCopyInfo[] {
  const resolvedDir = resolvePath(dirPath);
  if (!fs.existsSync(resolvedDir)) {
    return [];
  }

  const results: FileCopyInfo[] = [];

  function scan(currentDir: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push({
          fileName: entry.name,
          filePath: fullPath,
        });
      }
    }
  }

  scan(resolvedDir);
  return results;
}
