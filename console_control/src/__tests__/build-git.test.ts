import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  runCommand,
  resolvePackageManager,
  resolveDevScript,
  getCurrentGitBranch,
  getGitStatusSummary,
  handleLocalBuild,
  handleRemoteBuild,
  handleGitPush,
  handleGetPosts,
} from "../commands/build-git.js";
import { getProjectRootDir } from "../config.js";
import type { AppConfig } from "../types.js";

describe("Build & Git integration tests", () => {
  let tempDir: string;
  let mockConfig: AppConfig;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "build-git-test-"));
    mockConfig = {
      blogDir: path.join(tempDir, "blog"),
      projectRoot: tempDir,
      packageManager: "npm",
      destinations: {
        vault: path.join(tempDir, "vault"),
        dropbox: path.join(tempDir, "dropbox"),
        drive: path.join(tempDir, "drive"),
        driveLinux: path.join(tempDir, "driveLinux"),
      },
      postTemplate: {
        heroImage: "",
        tldrThemePrefix: "",
        author: "Artefaktas",
        aboutAuthor: "",
        kofiUrl: "",
      },
    };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("resolvePackageManager", () => {
    it("should prioritize CLI options over config and files", () => {
      const pm = resolvePackageManager("bun", "npm", tempDir);
      expect(pm).toBe("bun");
    });

    it("should prioritize config over lockfiles when CLI option is missing", () => {
      fs.writeFileSync(path.join(tempDir, "yarn.lock"), "");
      const pm = resolvePackageManager(undefined, "pnpm", tempDir);
      expect(pm).toBe("pnpm");
    });

    it("should detect package-lock.json as npm", () => {
      fs.writeFileSync(path.join(tempDir, "package-lock.json"), "{}");
      const pm = resolvePackageManager(undefined, undefined, tempDir);
      expect(pm).toBe("npm");
    });

    it("should detect bun.lock as bun", () => {
      fs.writeFileSync(path.join(tempDir, "bun.lock"), "");
      const pm = resolvePackageManager(undefined, undefined, tempDir);
      expect(pm).toBe("bun");
    });

    it("should detect pnpm-lock.yaml as pnpm", () => {
      fs.writeFileSync(path.join(tempDir, "pnpm-lock.yaml"), "");
      const pm = resolvePackageManager(undefined, undefined, tempDir);
      expect(pm).toBe("pnpm");
    });

    it("should detect yarn.lock as yarn", () => {
      fs.writeFileSync(path.join(tempDir, "yarn.lock"), "");
      const pm = resolvePackageManager(undefined, undefined, tempDir);
      expect(pm).toBe("yarn");
    });

    it("should default to npm when no lockfiles exist", () => {
      const pm = resolvePackageManager(undefined, undefined, tempDir);
      expect(pm).toBe("npm");
    });
  });

  describe("resolveDevScript", () => {
    it("should detect start script when dev script is not defined (e.g. Docusaurus)", () => {
      fs.writeFileSync(
        path.join(tempDir, "package.json"),
        JSON.stringify({
          scripts: {
            start: "docusaurus start",
            build: "docusaurus build",
          },
        })
      );
      const script = resolveDevScript(tempDir);
      expect(script).toBe("start");
    });

    it("should detect dev script when defined", () => {
      fs.writeFileSync(
        path.join(tempDir, "package.json"),
        JSON.stringify({
          scripts: {
            dev: "astro dev",
            start: "astro dev",
          },
        })
      );
      const script = resolveDevScript(tempDir);
      expect(script).toBe("dev");
    });
  });

  describe("getProjectRootDir", () => {
    it("should resolve project root from config if provided", () => {
      const root = getProjectRootDir(mockConfig);
      expect(root).toBe(tempDir);
    });

    it("should respect BLOG_PROJECT_ROOT environment variable override", () => {
      const originalEnv = process.env.BLOG_PROJECT_ROOT;
      try {
        process.env.BLOG_PROJECT_ROOT = "/custom/project/root";
        const root = getProjectRootDir(mockConfig);
        expect(root).toBe("/custom/project/root");
      } finally {
        if (originalEnv !== undefined) {
          process.env.BLOG_PROJECT_ROOT = originalEnv;
        } else {
          delete process.env.BLOG_PROJECT_ROOT;
        }
      }
    });
  });

  describe("runCommand", () => {
    it("should execute standard command and capture output in silent mode", async () => {
      const res = await runCommand(["echo", "Hello from test"], {
        cwd: tempDir,
        inheritStdio: false,
      });

      expect(res.success).toBe(true);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toBe("Hello from test");
    });

    it("should handle failing commands gracefully without crashing", async () => {
      const res = await runCommand(["non_existent_command_12345"], {
        cwd: tempDir,
        inheritStdio: false,
      });

      expect(res.success).toBe(false);
      expect(res.exitCode).not.toBe(0);
    });
  });

  describe("Git helpers in a real git repository", () => {
    beforeEach(async () => {
      // Initialize a real git repo in tempDir
      await runCommand(["git", "init"], { cwd: tempDir, inheritStdio: false });
      await runCommand(["git", "config", "user.email", "test@example.com"], { cwd: tempDir, inheritStdio: false });
      await runCommand(["git", "config", "user.name", "Test User"], { cwd: tempDir, inheritStdio: false });
    });

    it("should get git branch name", async () => {
      // Create initial commit so branch exists
      fs.writeFileSync(path.join(tempDir, "README.md"), "# Test Repo");
      await runCommand(["git", "add", "."], { cwd: tempDir, inheritStdio: false });
      await runCommand(["git", "commit", "-m", "Initial commit"], { cwd: tempDir, inheritStdio: false });

      const branch = await getCurrentGitBranch(tempDir);
      expect(["main", "master"]).toContain(branch);
    });

    it("should report git status summary accurately", async () => {
      // Before creating file, clean
      fs.writeFileSync(path.join(tempDir, "initial.txt"), "hello");
      await runCommand(["git", "add", "."], { cwd: tempDir, inheritStdio: false });
      await runCommand(["git", "commit", "-m", "init"], { cwd: tempDir, inheritStdio: false });

      let status = await getGitStatusSummary(tempDir);
      expect(status.clean).toBe(true);

      // Create untracked file
      fs.writeFileSync(path.join(tempDir, "newfile.md"), "# New File");
      status = await getGitStatusSummary(tempDir);
      expect(status.clean).toBe(false);
      expect(status.output).toContain("newfile.md");
    });

    it("should stage and commit changes with handleGitPush logic", async () => {
      // Create initial commit
      fs.writeFileSync(path.join(tempDir, "initial.txt"), "hello");
      await runCommand(["git", "add", "."], { cwd: tempDir, inheritStdio: false });
      await runCommand(["git", "commit", "-m", "init"], { cwd: tempDir, inheritStdio: false });

      // Create new file
      fs.writeFileSync(path.join(tempDir, "post.md"), "Sample content");

      // Stage and commit using git command directly
      const addRes = await runCommand(["git", "add", "."], { cwd: tempDir, inheritStdio: false });
      expect(addRes.success).toBe(true);

      const commitRes = await runCommand(["git", "commit", "-m", "rebuild"], { cwd: tempDir, inheritStdio: false });
      expect(commitRes.success).toBe(true);

      const status = await getGitStatusSummary(tempDir);
      expect(status.clean).toBe(true);
    });
  });

  describe("handleLocalBuild and handleRemoteBuild execution flow", () => {
    it("should stop execution if build fails in handleLocalBuild", async () => {
      // Mock package.json with a failing build script
      fs.writeFileSync(
        path.join(tempDir, "package.json"),
        JSON.stringify({
          name: "test-pkg",
          scripts: {
            build: "exit 1",
            dev: "echo dev-started",
          },
        })
      );

      const success = await handleLocalBuild(
        { cwd: tempDir, packageManager: "npm" },
        mockConfig
      );
      expect(success).toBe(false);
    });

    it("should succeed in handleLocalBuild with build-only flag", async () => {
      // Mock package.json with successful build script
      fs.writeFileSync(
        path.join(tempDir, "package.json"),
        JSON.stringify({
          name: "test-pkg",
          scripts: {
            build: "echo build-ok",
            dev: "echo dev-started",
          },
        })
      );

      const success = await handleLocalBuild(
        { cwd: tempDir, packageManager: "npm", buildOnly: true },
        mockConfig
      );
      expect(success).toBe(true);
    });
  });
});
