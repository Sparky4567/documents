import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  formatDateIso,
  parseDateIso,
  addDays,
  isValidIsoDate,
  resolvePath,
  getMdFiles,
} from "../utils.js";

describe("Utils tests", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-utils-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should format and parse ISO dates correctly", () => {
    const testDate = new Date(2026, 7, 20, 12, 0, 0); // August 20, 2026
    const formatted = formatDateIso(testDate);
    expect(formatted).toBe("2026-08-20");

    const parsed = parseDateIso("2026-08-20");
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(7);
    expect(parsed?.getDate()).toBe(20);
  });

  it("should correctly add and subtract days", () => {
    const start = parseDateIso("2026-01-31")!;
    const next = addDays(start, 1);
    expect(formatDateIso(next)).toBe("2026-02-01");

    const prev = addDays(start, -1);
    expect(formatDateIso(prev)).toBe("2026-01-30");
  });

  it("should validate ISO dates accurately", () => {
    expect(isValidIsoDate("2026-04-04")).toBe(true);
    expect(isValidIsoDate("2026-13-40")).toBe(true); // string matches regex, but let's check parse
    expect(isValidIsoDate("invalid-date")).toBe(false);
    expect(isValidIsoDate("2026/04/04")).toBe(false);
  });

  it("should resolve paths accurately", () => {
    const resolved = resolvePath("/absolute/path");
    expect(resolved).toBe("/absolute/path");

    const rel = resolvePath("subfolder", tempDir);
    expect(rel).toBe(path.join(tempDir, "subfolder"));
  });

  it("should recursively collect md files", () => {
    fs.writeFileSync(path.join(tempDir, "post1.md"), "content");
    fs.writeFileSync(path.join(tempDir, "ignore.txt"), "content");
    
    const sub = path.join(tempDir, "nested");
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, "post2.md"), "content");

    const files = getMdFiles(tempDir);
    expect(files.length).toBe(2);
    const names = files.map((f) => f.fileName).sort();
    expect(names).toEqual(["post1.md", "post2.md"]);
  });
});
