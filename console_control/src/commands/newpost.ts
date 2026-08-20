import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import type { AppConfig, NewPostOptions } from "../types.js";
import { loadConfig, loadTemplateContent } from "../config.js";
import {
  formatDateIso,
  parseDateIso,
  addDays,
  resolvePath,
  c,
} from "../utils.js";

/**
 * Returns a filename that increments with _1, _2, _3...
 * if base_name.md already exists.
 */
export function getIncrementedFilename(
  baseDir: string,
  baseName: string,
  extension = ".md"
): { filename: string; filepath: string } {
  const baseFilePath = path.join(baseDir, `${baseName}${extension}`);

  if (!fs.existsSync(baseFilePath)) {
    return {
      filename: `${baseName}${extension}`,
      filepath: path.resolve(baseFilePath),
    };
  }

  let counter = 1;
  while (true) {
    const filename = `${baseName}_${counter}${extension}`;
    const filepath = path.join(baseDir, filename);
    if (!fs.existsSync(filepath)) {
      return {
        filename,
        filepath: path.resolve(filepath),
      };
    }
    counter += 1;
  }
}

/**
 * Returns the most recent post date found in the directory.
 * Matches stems where the first 10 characters have 2 hyphens (YYYY-MM-DD).
 */
export function getLastPostDate(baseDir: string): Date | null {
  if (!fs.existsSync(baseDir)) return null;

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true });
  } catch {
    return null;
  }

  const dates: Date[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const stem = entry.name.slice(0, -3);
      const datePart = stem.slice(0, 10);
      const hyphenCount = (datePart.match(/-/g) || []).length;
      if (hyphenCount === 2) {
        const parsed = parseDateIso(datePart);
        if (parsed) {
          dates.push(parsed);
        }
      }
    }
  }

  if (dates.length === 0) return null;

  return dates.reduce((max, current) =>
    current.getTime() > max.getTime() ? current : max
  );
}

/**
 * Returns the first missing date in a range [startDate, endDate], or null if all are present.
 */
export function getMissingDate(
  baseDir: string,
  startDate: Date,
  endDate: Date
): Date | null {
  let current = new Date(startDate);
  const endIso = formatDateIso(endDate);

  while (formatDateIso(current) <= endIso) {
    const currentIso = formatDateIso(current);
    const targetFile = path.join(baseDir, `${currentIso}.md`);
    if (!fs.existsSync(targetFile)) {
      return current;
    }
    current = addDays(current, 1);
  }

  return null;
}

/**
 * Replaces placeholder tokens in a template string with actual values.
 */
export function renderTemplate(
  rawTemplate: string,
  variables: {
    title: string;
    stem: string;
    pubDate: string;
    date: string;
    heroImage: string;
    author: string;
    aboutAuthor: string;
    kofiUrl: string;
    tldrThemePrefix: string;
  }
): string {
  let content = rawTemplate;
  const replacements: Record<string, string> = {
    "{{title}}": variables.title,
    "{{slug}}": variables.title,
    "{{stem}}": variables.stem,
    "{{pubDate}}": variables.pubDate,
    "{{date}}": variables.date,
    "{{heroImage}}": variables.heroImage,
    "{{hero_image}}": variables.heroImage,
    "{{author}}": variables.author,
    "{{aboutAuthor}}": variables.aboutAuthor,
    "{{about_author}}": variables.aboutAuthor,
    "{{kofiUrl}}": variables.kofiUrl,
    "{{kofi_url}}": variables.kofiUrl,
    "{{tldrThemePrefix}}": variables.tldrThemePrefix,
    "{{tldr_theme_prefix}}": variables.tldrThemePrefix,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.replaceAll(placeholder, value);
  }

  return content;
}

/**
 * Generates the standard markdown post template content.
 */
export function generatePostContent(
  targetDate: Date,
  stem: string,
  config: AppConfig
): string {
  const dateIso = formatDateIso(targetDate);
  const { heroImage, author, aboutAuthor, kofiUrl, tldrThemePrefix } = config.postTemplate;
  const rawTemplate = loadTemplateContent(config);

  return renderTemplate(rawTemplate, {
    title: stem,
    stem,
    pubDate: dateIso,
    date: dateIso,
    heroImage: heroImage ?? "",
    author: author ?? "",
    aboutAuthor: aboutAuthor ?? "",
    kofiUrl: kofiUrl ?? "",
    tldrThemePrefix: tldrThemePrefix ?? "Šiandienos tema: ",
  });
}

/**
 * Creates the markdown file for a specific date with increment support.
 */
export function createBlogPost(
  targetDate: Date,
  baseDir: string,
  config: AppConfig
): { filename: string; filepath: string } {
  const targetDir = resolvePath(baseDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const targetDateIso = formatDateIso(targetDate);
  const { filename, filepath } = getIncrementedFilename(
    targetDir,
    targetDateIso
  );
  const stem = filename.endsWith(".md") ? filename.slice(0, -3) : filename;

  const content = generatePostContent(targetDate, stem, config);

  // Atomic write: fails ('wx') if file somehow appears between check and write
  fs.writeFileSync(filepath, content, { encoding: "utf-8", flag: "wx" });

  console.log(`✅ Blog post created: ${filename} at ${filepath}`);

  return { filename, filepath };
}

/**
 * Main handler for newpost command replicating newpost.py functionality.
 */
export async function handleNewPost(
  options: NewPostOptions = {},
  passedConfig?: AppConfig
): Promise<void> {
  const config = passedConfig ?? loadConfig();
  const targetDir = resolvePath(config.blogDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const today = new Date();

  // If specific date is supplied via CLI
  if (options.date) {
    const customDate = parseDateIso(options.date);
    if (!customDate) {
      console.error(
        c.red(`❌ Invalid date format "${options.date}". Please use YYYY-MM-DD.`)
      );
      process.exitCode = 1;
      return;
    }
    createBlogPost(customDate, targetDir, config);
    return;
  }

  let fillSkipped = options.fillSkipped ?? false;

  // If neither flag was explicitly passed, prompt interactively
  if (options.fillSkipped === undefined && options.today === undefined) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const answer = await rl.question(
        "💬 Would you like to fill in skipped dates? (y/n): "
      );
      fill_skipped_check: {
        fillSkipped = answer.trim().toLowerCase().startsWith("y");
      }
    } finally {
      rl.close();
    }
  }

  if (fillSkipped) {
    const lastDate = getLastPostDate(targetDir);
    const startDate = lastDate ? addDays(lastDate, 1) : addDays(today, -7);
    const missing = getMissingDate(targetDir, startDate, today);

    if (missing) {
      createBlogPost(missing, targetDir, config);
    } else {
      console.log("✅ No missing posts. Everything’s up to date.");
    }
  } else {
    createBlogPost(today, targetDir, config);
  }
}
