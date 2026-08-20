import fs from "node:fs";
import path from "node:path";
import type { AppConfig, DestinationKey, SyncStats } from "../types.js";
import { loadConfig } from "../config.js";
import { getMdFiles, resolvePath, c } from "../utils.js";

/**
 * Copies markdown files from blog directory to a specific target destination.
 * Matches the exact behavior and logging of the python move scripts.
 */
export function syncToDestination(
  destKey: DestinationKey,
  config: AppConfig
): SyncStats {
  const destPathRaw = config.destinations[destKey];
  const stats: SyncStats = {
    destinationKey: destKey,
    destinationPath: destPathRaw || "",
    totalFiles: 0,
    copiedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    success: true,
  };

  if (!destPathRaw) {
    const errorMsg = `No destination path configured for "${destKey}" in setting.json`;
    console.error(c.red(`Error: ${errorMsg}`));
    stats.success = false;
    stats.error = errorMsg;
    return stats;
  }

  const destDir = resolvePath(destPathRaw);
  stats.destinationPath = destDir;

  try {
    const blogFiles = getMdFiles(config.blogDir);
    stats.totalFiles = blogFiles.length;

    if (blogFiles.length === 0) {
      console.log(
        c.yellow(`⚠️ No .md files found in blog directory: ${config.blogDir}`)
      );
      return stats;
    }

    // Ensure destination directory exists or attempt to create it
    if (!fs.existsSync(destDir)) {
      try {
        fs.mkdirSync(destDir, { recursive: true });
      } catch (err: any) {
        console.error(
          c.red(
            `❌ Destination directory does not exist and could not be created: ${destDir}`
          )
        );
        console.error(`Error: ${err?.message || err}`);
        stats.success = false;
        stats.error = err?.message || String(err);
        return stats;
      }
    }

    for (const ob of blogFiles) {
      const destFilePath = path.resolve(destDir, ob.fileName);

      try {
        if (!fs.existsSync(destFilePath)) {
          console.log(`${destFilePath} does not exist. ❌`);
          fs.copyFileSync(ob.filePath, destFilePath);
          console.log(`${destFilePath} was copied to ${destFilePath}. ✅`);
          stats.copiedCount++;
        } else {
          console.log(`${destFilePath} does exist. Skipping. ✅`);
          stats.skippedCount++;
        }
      } catch (err: any) {
        console.error(`Error: ${err?.message || err}`);
        stats.errorCount++;
        stats.success = false;
      }
    }
  } catch (e: any) {
    console.log(`Error: ${e?.message || e}`);
    stats.success = false;
    stats.error = e?.message || String(e);
  }

  return stats;
}

/**
 * Handler for movetovault (replicates movetovault.py).
 */
export function handleMoveToVault(passedConfig?: AppConfig): SyncStats {
  const config = passedConfig ?? loadConfig();
  return syncToDestination("vault", config);
}

/**
 * Handler for movetobox (replicates movetobox.py).
 */
export function handleMoveToBox(passedConfig?: AppConfig): SyncStats {
  const config = passedConfig ?? loadConfig();
  return syncToDestination("dropbox", config);
}

/**
 * Handler for movetodrive (replicates movetodrive.py).
 */
export function handleMoveToDrive(passedConfig?: AppConfig): SyncStats {
  const config = passedConfig ?? loadConfig();
  return syncToDestination("drive", config);
}

/**
 * Handler for movetodrivelinux (replicates movetodrivelinux.py).
 */
export function handleMoveToDriveLinux(passedConfig?: AppConfig): SyncStats {
  const config = passedConfig ?? loadConfig();
  return syncToDestination("driveLinux", config);
}

/**
 * Handler for sync-all / movetoall: syncs to all configured destinations.
 */
export function handleSyncAll(passedConfig?: AppConfig): SyncStats[] {
  const config = passedConfig ?? loadConfig();
  const destinations: DestinationKey[] = [
    "vault",
    "dropbox",
    "drive",
    "driveLinux",
  ];

  console.log(c.bold(c.cyan("\n🚀 Starting full synchronization across all destinations...\n")));
  const results: SyncStats[] = [];

  for (const key of destinations) {
    const destName = key.toUpperCase();
    console.log(c.bold(c.blue(`--- [${destName}] ---`)));
    const stat = syncToDestination(key, config);
    results.push(stat);
    console.log("");
  }

  console.log(c.bold(c.cyan("📊 Synchronization Summary:")));
  for (const stat of results) {
    const statusIcon = stat.success ? "✅" : "⚠️";
    console.log(
      ` ${statusIcon} ${c.bold(stat.destinationKey.padEnd(12))} : ${stat.copiedCount} copied, ${stat.skippedCount} skipped, ${stat.errorCount} errors (${stat.destinationPath})`
    );
  }

  return results;
}
