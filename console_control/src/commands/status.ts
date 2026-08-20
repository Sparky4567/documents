import fs from "node:fs";
import path from "node:path";
import type { AppConfig } from "../types.js";
import { loadConfig } from "../config.js";
import {
  getMdFiles,
  resolvePath,
  formatDateIso,
  addDays,
  c,
} from "../utils.js";
import { getLastPostDate, getMissingDate } from "./newpost.js";

/**
 * Displays status and statistics about the blog and destination backups.
 */
export function handleStatus(passedConfig?: AppConfig): void {
  const config = passedConfig ?? loadConfig();
  const blogDir = resolvePath(config.blogDir);

  console.log(c.bold(c.cyan("\n📊 Artefaktas Blog & Backup Status\n")));

  // 1. Blog Directory Info
  console.log(c.bold(c.blue("📁 Blog Directory:")));
  console.log(`   Path: ${c.dim(blogDir)}`);

  if (!fs.existsSync(blogDir)) {
    console.log(c.red("   ❌ Directory does not exist!\n"));
    return;
  }

  const blogFiles = getMdFiles(blogDir);
  console.log(`   Total Posts: ${c.bold(blogFiles.length)}`);

  const lastPostDate = getLastPostDate(blogDir);
  const today = new Date();

  if (lastPostDate) {
    const lastDateStr = formatDateIso(lastPostDate);
    const todayStr = formatDateIso(today);
    console.log(`   Latest Post Date: ${c.bold(c.green(lastDateStr))}`);
    console.log(`   Today:            ${c.dim(todayStr)}`);

    const startDate = addDays(lastPostDate, 1);
    const missingDate = getMissingDate(blogDir, startDate, today);

    if (missingDate) {
      console.log(
        `   Missing Post:     ${c.yellow(
          `⚠️ First missing date found: ${formatDateIso(missingDate)}`
        )}`
      );
    } else {
      console.log(`   Post Health:      ${c.green("✅ All dates up to date")}`);
    }
  } else {
    console.log(`   Latest Post Date: ${c.yellow("None found")}`);
  }

  // 2. Destinations Health Check
  console.log(c.bold(c.blue("\n💾 Backup Destinations:")));

  const destinationEntries = Object.entries(config.destinations);

  for (const [key, rawPath] of destinationEntries) {
    const resolved = resolvePath(rawPath);
    const exists = fs.existsSync(resolved);

    let statusText = "";
    if (exists) {
      try {
        const destFiles = getMdFiles(resolved);
        const diff = blogFiles.length - destFiles.length;
        const diffText =
          diff > 0
            ? c.yellow(`(${diff} files behind)`)
            : diff === 0
            ? c.green(`(in sync)`)
            : c.cyan(`(${destFiles.length} files)`);
        statusText = `${c.green("✅ Accessible")} ${diffText}`;
      } catch {
        statusText = c.green("✅ Accessible");
      }
    } else {
      statusText = c.red("❌ Not Found / Not Mounted");
    }

    console.log(`   • ${c.bold(key.padEnd(12))}: ${statusText}`);
    console.log(`     ${c.dim(resolved)}`);
  }

  console.log("");
}
