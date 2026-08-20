import fs from "node:fs";
import path from "node:path";
import type {
  AppConfig,
  BuildOptions,
  RemoteBuildOptions,
  GitPushOptions,
  GitPullOptions,
  CommandResult,
} from "../types.js";
import { loadConfig, getProjectRootDir } from "../config.js";
import { c } from "../utils.js";

/**
 * Execute a command asynchronously with real-time streaming or piped output.
 */
export async function runCommand(
  cmd: string[],
  options: {
    cwd?: string;
    inheritStdio?: boolean;
    silent?: boolean;
  } = {}
): Promise<CommandResult> {
  const cwd = options.cwd ?? getProjectRootDir();
  const inheritStdio = options.inheritStdio ?? !options.silent;

  try {
    if (inheritStdio) {
      const proc = Bun.spawn(cmd, {
        cwd,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
        env: process.env,
      });

      const exitCode = await proc.exited;
      return {
        command: cmd.join(" "),
        exitCode,
        success: exitCode === 0,
      };
    } else {
      const proc = Bun.spawn(cmd, {
        cwd,
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
        env: process.env,
      });

      const [stdoutText, stderrText, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);

      return {
        command: cmd.join(" "),
        exitCode,
        success: exitCode === 0,
        stdout: stdoutText.trim(),
        stderr: stderrText.trim(),
      };
    }
  } catch (err: any) {
    return {
      command: cmd.join(" "),
      exitCode: 1,
      success: false,
      stderr: err?.message || String(err),
    };
  }
}

/**
 * Retrieves the currently checked out Git branch in project root.
 */
export async function getCurrentGitBranch(cwd?: string): Promise<string> {
  const res = await runCommand(["git", "branch", "--show-current"], {
    cwd,
    inheritStdio: false,
  });
  if (res.success && res.stdout && res.stdout.length > 0) {
    return res.stdout.trim();
  }
  return "main";
}

/**
 * Retrieves a summary of current uncommitted git changes.
 */
export async function getGitStatusSummary(
  cwd?: string
): Promise<{ clean: boolean; output: string }> {
  const res = await runCommand(["git", "status", "--porcelain"], {
    cwd,
    inheritStdio: false,
  });
  const output = res.stdout || "";
  return {
    clean: output.length === 0,
    output,
  };
}

/**
 * Resolves the preferred package manager (npm, bun, pnpm, yarn).
 */
export function resolvePackageManager(
  optionsPm?: string,
  configPm?: string,
  projectDir?: string
): string {
  if (optionsPm) return optionsPm;
  if (configPm) return configPm;

  // Check if project has lockfiles or default to npm (matching original bash scripts)
  const dir = projectDir ?? getProjectRootDir();
  if (fs.existsSync(path.join(dir, "package-lock.json"))) {
    return "npm";
  }
  if (fs.existsSync(path.join(dir, "bun.lock")) || fs.existsSync(path.join(dir, "bun.lockb"))) {
    return "bun";
  }
  if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (fs.existsSync(path.join(dir, "yarn.lock"))) {
    return "yarn";
  }
  return "npm";
}

/**
 * Resolves the dev / start script name from package.json in project root.
 */
export function resolveDevScript(projectDir?: string): string {
  const dir = projectDir ?? getProjectRootDir();
  const pkgPath = path.join(dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.scripts?.start && !pkg.scripts?.dev) {
        return "start";
      }
      if (pkg.scripts?.dev) {
        return "dev";
      }
      if (pkg.scripts?.start) {
        return "start";
      }
    } catch {
      // Fallback below
    }
  }
  return "start";
}

/**
 * Handler for local build and dev server.
 * Replicates and enhances `local.sh` / `local.bat`:
 * `npm run build && npm run start` (or `npm run dev`)
 */
export async function handleLocalBuild(
  options: BuildOptions = {},
  passedConfig?: AppConfig
): Promise<boolean> {
  const config = passedConfig ?? loadConfig();
  const projectRoot = options.cwd ?? getProjectRootDir(config);
  const pm = resolvePackageManager(options.packageManager, config.packageManager, projectRoot);
  const devScript = resolveDevScript(projectRoot);

  console.log(c.bold(c.cyan("\n==================================================")));
  console.log(c.bold(c.cyan("     🛠️  LOCAL BUILD & DEV SERVER (DOCUSAURUS)    ")));
  console.log(c.bold(c.cyan("==================================================")));
  console.log(` 📁 Project Root:    ${c.dim(projectRoot)}`);
  console.log(` 📦 Package Manager: ${c.bold(c.yellow(pm))}`);
  console.log(` ⚡ Dev Script:      ${c.bold(c.cyan(`${pm} run ${devScript}`))}`);
  console.log(c.dim("--------------------------------------------------\n"));

  // Step 1: Run build (unless --dev-only is specified)
  if (!options.devOnly) {
    console.log(c.bold(c.blue(`🔨 [1/2] Building Docusaurus project (${pm} run build)...`)));
    const buildRes = await runCommand([pm, "run", "build"], {
      cwd: projectRoot,
      inheritStdio: true,
    });

    if (!buildRes.success) {
      console.error(
        c.red(`\n❌ Local build failed with exit code ${buildRes.exitCode}.`)
      );
      if (!options.buildOnly) {
        console.error(c.yellow(`⚠️ Dev server will not be started due to build errors.`));
      }
      return false;
    }
    console.log(c.green(`\n✅ Build step completed successfully!\n`));
  } else {
    console.log(c.dim(`⏩ [1/2] Skipping build step (--dev-only specified)\n`));
  }

  // If --build-only was requested, exit here
  if (options.buildOnly) {
    console.log(c.bold(c.green(`✨ Build finished successfully!`)));
    return true;
  }

  // Step 2: Start dev server
  console.log(c.bold(c.magenta(`⚡ [2/2] Starting development server (${pm} run ${devScript})...`)));
  console.log(c.dim(`(Press Ctrl+C to stop the development server)\n`));

  const devRes = await runCommand([pm, "run", devScript], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!devRes.success && devRes.exitCode !== 0 && devRes.exitCode !== 130) {
    console.error(c.red(`\n❌ Dev server exited with code ${devRes.exitCode}.`));
    return false;
  }

  return true;
}

/**
 * Handler for remote build, staging, committing, and pushing to Git repository.
 * Replicates and enhances `remote.sh` / `remote.bat`:
 * `npm run build && git add . && git commit -m "rebuild" && git push`
 */
export async function handleRemoteBuild(
  options: RemoteBuildOptions = {},
  passedConfig?: AppConfig
): Promise<boolean> {
  const config = passedConfig ?? loadConfig();
  const projectRoot = options.cwd ?? getProjectRootDir(config);
  const pm = resolvePackageManager(options.packageManager, config.packageManager, projectRoot);
  const commitMessage = options.message && options.message.trim().length > 0 ? options.message.trim() : "rebuild";
  const remote = options.remote || "origin";
  const branch = options.branch || (await getCurrentGitBranch(projectRoot));

  console.log(c.bold(c.cyan("\n==================================================")));
  console.log(c.bold(c.cyan("   🚀 REMOTE BUILD & DEPLOY (DOCUSAURUS + GIT)    ")));
  console.log(c.bold(c.cyan("==================================================")));
  console.log(` 📁 Project Root:    ${c.dim(projectRoot)}`);
  console.log(` 📦 Package Manager: ${c.bold(c.yellow(pm))}`);
  console.log(` 📝 Commit Message:  ${c.bold(c.green(`"${commitMessage}"`))}`);
  console.log(` 🌐 Remote / Branch: ${c.bold(c.blue(`${remote}/${branch}`))}`);
  console.log(c.dim("--------------------------------------------------\n"));

  // Step 1: Run build (unless --skip-build is specified)
  if (!options.skipBuild) {
    console.log(c.bold(c.blue(`🔨 [1/4] Building Docusaurus project (${pm} run build)...`)));
    const buildRes = await runCommand([pm, "run", "build"], {
      cwd: projectRoot,
      inheritStdio: true,
    });

    if (!buildRes.success) {
      console.error(
        c.red(`\n❌ Build failed with exit code ${buildRes.exitCode}. Aborting remote deployment.`)
      );
      return false;
    }
    console.log(c.green(`\n✅ Build step completed successfully!\n`));
  } else {
    console.log(c.dim(`⏩ [1/4] Skipping build step (--skip-build specified)\n`));
  }

  // Step 2: Git Stage
  console.log(c.bold(c.blue(`📦 [2/4] Staging changes (git add .)...`)));
  const addRes = await runCommand(["git", "add", "."], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!addRes.success) {
    console.error(c.red(`\n❌ Failed to stage changes with git add.`));
    return false;
  }
  console.log(c.green(`✅ Changes staged.\n`));

  // Step 3: Git Commit
  console.log(c.bold(c.blue(`📝 [3/4] Committing changes (git commit -m "${commitMessage}")...`)));
  const commitRes = await runCommand(["git", "commit", "-m", commitMessage], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!commitRes.success) {
    // Check if failure is due to nothing to commit
    const status = await getGitStatusSummary(projectRoot);
    if (status.clean) {
      console.log(c.yellow(`ℹ️ Nothing new to commit (working tree clean). Continuing to push...\n`));
    } else {
      console.error(c.red(`\n❌ Failed to commit changes.`));
      return false;
    }
  } else {
    console.log(c.green(`✅ Changes committed.\n`));
  }

  // Step 4: Git Push
  console.log(c.bold(c.blue(`🚀 [4/4] Pushing to remote (${remote} ${branch})...`)));
  const pushRes = await runCommand(["git", "push", remote, branch], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!pushRes.success) {
    console.error(c.red(`\n❌ Git push failed with exit code ${pushRes.exitCode}.`));
    return false;
  }

  console.log(c.bold(c.green(`\n🎉 Remote build and GitHub push completed successfully!\n`)));
  return true;
}

/**
 * Handler for pushing changes directly to GitHub repository.
 * `git add . && git commit -m "<msg>" && git push`
 */
export async function handleGitPush(
  options: GitPushOptions = {},
  passedConfig?: AppConfig
): Promise<boolean> {
  const config = passedConfig ?? loadConfig();
  const projectRoot = options.cwd ?? getProjectRootDir(config);
  const commitMessage =
    options.message && options.message.trim().length > 0 ? options.message.trim() : "rebuild";
  const remote = options.remote || "origin";
  const branch = options.branch || (await getCurrentGitBranch(projectRoot));
  const files = options.files && options.files.length > 0 ? options.files : ["."];

  console.log(c.bold(c.cyan("\n==================================================")));
  console.log(c.bold(c.cyan("          📤 PUSH TO GITHUB REPOSITORY            ")));
  console.log(c.bold(c.cyan("==================================================")));
  console.log(` 📁 Project Root:    ${c.dim(projectRoot)}`);
  console.log(` 📝 Commit Message:  ${c.bold(c.green(`"${commitMessage}"`))}`);
  console.log(` 🌐 Remote / Branch: ${c.bold(c.blue(`${remote}/${branch}`))}`);
  console.log(c.dim("--------------------------------------------------\n"));

  // Step 1: Git Add
  console.log(c.bold(c.blue(`📦 [1/3] Staging changes (git add ${files.join(" ")})...`)));
  const addRes = await runCommand(["git", "add", ...files], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!addRes.success) {
    console.error(c.red(`\n❌ Failed to stage changes with git add.`));
    return false;
  }
  console.log(c.green(`✅ Changes staged.\n`));

  // Step 2: Git Commit
  console.log(c.bold(c.blue(`📝 [2/3] Committing changes (git commit -m "${commitMessage}")...`)));
  const commitRes = await runCommand(["git", "commit", "-m", commitMessage], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!commitRes.success) {
    const status = await getGitStatusSummary(projectRoot);
    if (status.clean) {
      console.log(c.yellow(`ℹ️ Nothing new to commit (working tree clean). Continuing to push...\n`));
    } else {
      console.error(c.red(`\n❌ Failed to commit changes.`));
      return false;
    }
  } else {
    console.log(c.green(`✅ Changes committed.\n`));
  }

  // Step 3: Git Push
  console.log(c.bold(c.blue(`🚀 [3/3] Pushing to remote (${remote} ${branch})...`)));
  const pushRes = await runCommand(["git", "push", remote, branch], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!pushRes.success) {
    console.error(c.red(`\n❌ Git push failed with exit code ${pushRes.exitCode}.`));
    return false;
  }

  console.log(c.bold(c.green(`\n🎉 Changes pushed to GitHub successfully!\n`)));
  return true;
}

/**
 * Handler for pulling / fetching latest docs and posts from GitHub.
 * Replicates and enhances `get-docs.sh` / `get-posts.sh`:
 * `git fetch origin && git reset --hard origin/main && git pull origin main`
 */
export async function handleGetPosts(
  options: GitPullOptions = {},
  passedConfig?: AppConfig
): Promise<boolean> {
  const config = passedConfig ?? loadConfig();
  const projectRoot = options.cwd ?? getProjectRootDir(config);
  const remote = options.remote || "origin";
  const branch = options.branch || (await getCurrentGitBranch(projectRoot));
  const isHard = options.hard ?? true; // Default matching get-docs.sh reset --hard

  console.log(c.bold(c.cyan("\n==================================================")));
  console.log(c.bold(c.cyan("     📥 PULL DOCS / POSTS FROM GITHUB REPO        ")));
  console.log(c.bold(c.cyan("==================================================")));
  console.log(` 📁 Project Root:    ${c.dim(projectRoot)}`);
  console.log(` 🌐 Remote / Branch: ${c.bold(c.blue(`${remote}/${branch}`))}`);
  console.log(` ⚙️ Mode:            ${isHard ? c.bold(c.yellow("Hard Reset & Sync")) : c.green("Safe Pull")}`);
  console.log(c.dim("--------------------------------------------------\n"));

  // Step 1: Fetch
  console.log(c.bold(c.blue(`📡 [1/${isHard ? "3" : "2"}] Fetching from remote (${remote})...`)));
  const fetchRes = await runCommand(["git", "fetch", remote], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!fetchRes.success) {
    console.error(c.red(`\n❌ Git fetch failed.`));
    return false;
  }
  console.log(c.green(`✅ Remote fetched.\n`));

  // Step 2: Hard reset if requested
  if (isHard) {
    console.log(c.bold(c.blue(`🔄 [2/3] Resetting local branch to ${remote}/${branch}...`)));
    const resetRes = await runCommand(["git", "reset", "--hard", `${remote}/${branch}`], {
      cwd: projectRoot,
      inheritStdio: true,
    });

    if (!resetRes.success) {
      console.error(c.red(`\n❌ Git reset --hard failed.`));
      return false;
    }
    console.log(c.green(`✅ Local branch reset to match remote.\n`));
  }

  // Step 3: Pull
  const stepNum = isHard ? "3/3" : "2/2";
  console.log(c.bold(c.blue(`📥 [${stepNum}] Pulling latest changes (${remote} ${branch})...`)));
  const pullRes = await runCommand(["git", "pull", remote, branch], {
    cwd: projectRoot,
    inheritStdio: true,
  });

  if (!pullRes.success) {
    console.error(c.red(`\n❌ Git pull failed.`));
    return false;
  }

  console.log(c.bold(c.green(`\n🎉 Blog posts and repository updated successfully!\n`)));
  return true;
}
