import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { syncToDestination } from "../commands/sync.js";
import type { AppConfig } from "../types.js";

describe("Sync commands tests", () => {
  let sourceDir: string;
  let destDir: string;
  let config: AppConfig;

  beforeEach(() => {
    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-source-test-"));
    destDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-dest-test-"));

    config = {
      blogDir: sourceDir,
      destinations: {
        vault: destDir,
        dropbox: destDir,
        drive: destDir,
        driveLinux: destDir,
      },
      postTemplate: {
        heroImage: "",
        tldrThemePrefix: "",
        author: "",
        aboutAuthor: "",
        kofiUrl: "",
      },
    };
  });

  afterEach(() => {
    fs.rmSync(sourceDir, { recursive: true, force: true });
    fs.rmSync(destDir, { recursive: true, force: true });
  });

  it("should copy non-existing files to destination and skip existing ones", () => {
    fs.writeFileSync(path.join(sourceDir, "file1.md"), "hello file 1");
    fs.writeFileSync(path.join(sourceDir, "file2.md"), "hello file 2");

    // Pre-populate file1 in destination
    fs.writeFileSync(path.join(destDir, "file1.md"), "existing file 1");

    const stats = syncToDestination("vault", config);

    expect(stats.totalFiles).toBe(2);
    expect(stats.copiedCount).toBe(1); // file2 copied
    expect(stats.skippedCount).toBe(1); // file1 skipped
    expect(stats.errorCount).toBe(0);

    expect(fs.existsSync(path.join(destDir, "file2.md"))).toBe(true);
    expect(fs.readFileSync(path.join(destDir, "file1.md"), "utf-8")).toBe("existing file 1");
  });

  it("should report missing destination path cleanly", () => {
    const stats = syncToDestination("non_existent_key" as any, config);
    expect(stats.success).toBe(false);
    expect(stats.error).toContain("No destination path configured");
  });
});
