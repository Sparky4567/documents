import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  getIncrementedFilename,
  getLastPostDate,
  getMissingDate,
  createBlogPost,
} from "../commands/newpost.js";
import { parseDateIso, formatDateIso } from "../utils.js";
import type { AppConfig } from "../types.js";

describe("NewPost command tests", () => {
  let tempDir: string;
  const mockConfig: AppConfig = {
    blogDir: "",
    destinations: {
      vault: "",
      dropbox: "",
      drive: "",
      driveLinux: "",
    },
    postTemplate: {
      heroImage: "https://example.com/hero.jpg",
      tldrThemePrefix: "Theme: ",
      author: "Test Author",
      aboutAuthor: "About test author",
      kofiUrl: "https://ko-fi.com/test",
    },
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-newpost-test-"));
    mockConfig.blogDir = tempDir;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should return base filename if file does not exist", () => {
    const res = getIncrementedFilename(tempDir, "2026-08-20");
    expect(res.filename).toBe("2026-08-20.md");
    expect(res.filepath).toBe(path.join(tempDir, "2026-08-20.md"));
  });

  it("should increment filename if file already exists", () => {
    fs.writeFileSync(path.join(tempDir, "2026-08-20.md"), "content");
    const res1 = getIncrementedFilename(tempDir, "2026-08-20");
    expect(res1.filename).toBe("2026-08-20_1.md");

    fs.writeFileSync(path.join(tempDir, "2026-08-20_1.md"), "content");
    const res2 = getIncrementedFilename(tempDir, "2026-08-20");
    expect(res2.filename).toBe("2026-08-20_2.md");
  });

  it("should identify the latest post date from existing files", () => {
    fs.writeFileSync(path.join(tempDir, "2026-01-01.md"), "content");
    fs.writeFileSync(path.join(tempDir, "2026-03-15.md"), "content");
    fs.writeFileSync(path.join(tempDir, "2026-03-15_1.md"), "content");
    fs.writeFileSync(path.join(tempDir, "2025-12-31.md"), "content");
    fs.writeFileSync(path.join(tempDir, "notes.md"), "content");

    const latest = getLastPostDate(tempDir);
    expect(latest).not.toBeNull();
    expect(formatDateIso(latest!)).toBe("2026-03-15");
  });

  it("should find the first missing date in a range", () => {
    fs.writeFileSync(path.join(tempDir, "2026-04-01.md"), "content");
    fs.writeFileSync(path.join(tempDir, "2026-04-02.md"), "content");
    // 2026-04-03 is missing
    fs.writeFileSync(path.join(tempDir, "2026-04-04.md"), "content");

    const start = parseDateIso("2026-04-01")!;
    const end = parseDateIso("2026-04-04")!;

    const missing = getMissingDate(tempDir, start, end);
    expect(missing).not.toBeNull();
    expect(formatDateIso(missing!)).toBe("2026-04-03");
  });

  it("should return null if no dates are missing", () => {
    fs.writeFileSync(path.join(tempDir, "2026-04-01.md"), "content");
    fs.writeFileSync(path.join(tempDir, "2026-04-02.md"), "content");
    fs.writeFileSync(path.join(tempDir, "2026-04-03.md"), "content");

    const start = parseDateIso("2026-04-01")!;
    const end = parseDateIso("2026-04-03")!;

    const missing = getMissingDate(tempDir, start, end);
    expect(missing).toBeNull();
  });

  it("should create a new post with correct template and frontmatter", () => {
    const targetDate = parseDateIso("2026-08-20")!;
    const res = createBlogPost(targetDate, tempDir, mockConfig);

    expect(fs.existsSync(res.filepath)).toBe(true);
    const content = fs.readFileSync(res.filepath, "utf-8");

    expect(content).toContain("slug: 2026-08-20");
    expect(content).toContain("title: 2026-08-20");
    expect(content).toContain("authors: [Test Author]");
    expect(content).toContain("tags: [newpost]");
    expect(content).toContain("<!-- truncate -->");
    expect(content).toContain("About author: About test author");
    expect(content).toContain("https://ko-fi.com/test");
  });
});
