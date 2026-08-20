#!/usr/bin/env bun
import { loadConfig } from "./src/config.js";
import { handleNewPost } from "./src/commands/newpost.js";
import {
  handleMoveToVault,
  handleMoveToBox,
  handleMoveToDrive,
  handleMoveToDriveLinux,
  handleSyncAll,
} from "./src/commands/sync.js";
import { handleStatus } from "./src/commands/status.js";
import { handleConfigCommand } from "./src/commands/config-cmd.js";
import { handleTemplateCommand } from "./src/commands/template-cmd.js";
import {
  handleLocalBuild,
  handleRemoteBuild,
  handleGitPush,
  handleGetPosts,
} from "./src/commands/build-git.js";
import { runInteractiveMenu } from "./src/interactive.js";
import { c } from "./src/utils.js";

function printHelp(): void {
  console.log(`
${c.bold(c.cyan("Artefaktas Docs Control CLI (Bun)"))}
Unified CLI tool for creating blog posts, managing Docusaurus builds, Git repository operations, and synchronizing backups across destinations.

${c.bold(c.yellow("USAGE:"))}
  ${c.green("bun run index.ts")} ${c.dim("[command] [options]")}
  ${c.green("./index.ts")} ${c.dim("[command] [options]")}

${c.bold(c.yellow("COMMANDS:"))}
  ${c.bold(c.cyan("local"))} ${c.dim("(aliases: local-build, build:local, start, dev, l, build-local)")}
      Run local Docusaurus build and start local development server (based on local.sh).
      ${c.dim("Options:")}
        ${c.cyan("-b, --build-only")}       Run only the build step without starting dev server
        ${c.cyan("--dev-only")}            Start dev server without building first
        ${c.cyan("--pm, --package-manager <name>")} Specify package manager (npm / bun / pnpm / yarn)

  ${c.bold(c.cyan("remote"))} ${c.dim("(aliases: remote-build, build:remote, deploy, publish, r, build-remote)")}
      Build project, stage files, commit, and push to GitHub (based on remote.sh).
      ${c.dim("Options:")}
        ${c.cyan("-m, --message <msg>")}    Git commit message (default: "rebuild")
        ${c.cyan("--skip-build")}          Skip build step and only commit & push
        ${c.cyan("--remote <name>")}       Git remote name (default: origin)
        ${c.cyan("-B, --branch <name>")}   Git branch name (default: current branch)
        ${c.cyan("--pm, --package-manager <name>")} Specify package manager (npm / bun / pnpm / yarn)

  ${c.bold(c.cyan("push"))} ${c.dim("(aliases: git-push, git:push, gp, p, push-repo, push-github)")}
      Stage changes, commit, and push directly to GitHub repository.
      ${c.dim("Options:")}
        ${c.cyan("-m, --message <msg>")}    Git commit message (default: "rebuild")
        ${c.cyan("--remote <name>")}       Git remote name (default: origin)
        ${c.cyan("-B, --branch <name>")}   Git branch name (default: current branch)

  ${c.bold(c.cyan("get-docs"))} ${c.dim("(aliases: getdocs, get-posts, getposts, pull, git-pull, git:pull, fetch-docs)")}
      Pull / sync latest docs and posts from GitHub repository (based on get-docs.sh).
      ${c.dim("Options:")}
        ${c.cyan("--hard")}                Perform git fetch + reset --hard + pull (default)
        ${c.cyan("--safe")}                Perform safe git pull without hard reset
        ${c.cyan("--remote <name>")}       Git remote name (default: origin)
        ${c.cyan("-B, --branch <name>")}   Git branch name (default: main)

  ${c.bold(c.green("newpost"))} ${c.dim("(aliases: new, create, post)")}
      Create a new daily blog post template.
      ${c.dim("Options:")}
        ${c.cyan("-f, --fill-skipped")}    Automatically detect and fill first missing date
        ${c.cyan("-t, --today")}           Create a post for today without asking
        ${c.cyan("-d, --date <YYYY-MM-DD>")} Create post for a specific date
        ${c.cyan("-e, --edit-template")}   Edit template in text editor before creating post

  ${c.bold(c.magenta("template"))} ${c.dim("(aliases: edit-template, tmpl, t)")}
      View, edit, or customize the blog post template.
      ${c.dim("Options:")}
        ${c.cyan("-e, --edit")}            Open template file in preferred editor ($EDITOR/nano/vim/code)
        ${c.cyan("--editor <name>")}       Specify editor command (e.g. nano, vim, code)
        ${c.cyan("-p, --preview")}         Show rendered preview of template with current settings
        ${c.cyan("-v, --view")}            Display raw template file with placeholders
        ${c.cyan("-r, --reset")}           Reset template to default content
        ${c.cyan("--path")}                Print path to template file
        ${c.cyan("--author <name>")}       Update author name in settings
        ${c.cyan("--hero <url>")}          Update hero image URL in settings
        ${c.cyan("--kofi <url>")}          Update Ko-Fi URL in settings

  ${c.bold(c.blue("movetovault"))} ${c.dim("(aliases: vault, move:vault)")}
      Copy blog posts to Obsidian Vault destination.

  ${c.bold(c.blue("movetobox"))} ${c.dim("(aliases: dropbox, box, move:box)")}
      Copy blog posts to Dropbox backup destination.

  ${c.bold(c.blue("movetodrive"))} ${c.dim("(aliases: drive, gdrive, move:drive)")}
      Copy blog posts to Google Drive (ChromeOS mount) destination.

  ${c.bold(c.blue("movetodrivelinux"))} ${c.dim("(aliases: drivelinux, gdrive-linux, move:drivelinux)")}
      Copy blog posts to Google Drive (Linux GVFS) destination.

  ${c.bold(c.magenta("sync-all"))} ${c.dim("(aliases: movetoall, all, sync)")}
      Synchronize blog posts across ALL configured destinations at once.

  ${c.bold(c.yellow("status"))} ${c.dim("(aliases: info, check, stats)")}
      Show blog overview, latest post, missing date check, and backup destination status.

  ${c.bold(c.yellow("config"))} ${c.dim("(aliases: settings, setting)")}
      Display current setting.json configuration and resolved paths.
      ${c.dim("Options:")}
        ${c.cyan("-p, --path")}            Print the absolute path to setting.json

  ${c.bold(c.white("menu"))} ${c.dim("(aliases: interactive, tui)")}
      Open the interactive full-screen menu.

  ${c.bold(c.white("help"))} ${c.dim("(aliases: --help, -h)")}
      Display this help message.

${c.bold(c.yellow("EXAMPLES:"))}
  ${c.dim("# Interactive menu")}
  bun run start
  
  ${c.dim("# Run local build and start dev server")}
  bun run index.ts local

  ${c.dim("# Run remote build, commit, and push")}
  bun run index.ts remote -m "Add new blog post"

  ${c.dim("# Push changes directly to GitHub")}
  bun run index.ts push -m "Fix blog post styles"

  ${c.dim("# Pull / reset latest docs and posts from GitHub")}
  bun run index.ts get-docs

  ${c.dim("# Create post for today")}
  bun run index.ts newpost --today

  ${c.dim("# Fill skipped missing date")}
  bun run index.ts newpost --fill-skipped

  ${c.dim("# Copy posts to all destinations")}
  bun run index.ts sync-all
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  // If no command provided, open interactive menu if in TTY or show help
  if (!command) {
    if (process.stdin.isTTY) {
      await runInteractiveMenu();
    } else {
      printHelp();
    }
    return;
  }

  const config = loadConfig();

  switch (command) {
    case "local":
    case "local-build":
    case "build:local":
    case "build-local":
    case "dev":
    case "start":
    case "l": {
      const buildOnly = args.includes("--build-only") || args.includes("-b");
      const devOnly = args.includes("--dev-only");
      let packageManager: string | undefined;
      const pmIndex = args.findIndex((arg) => arg === "--pm" || arg === "--package-manager");
      if (pmIndex !== -1 && args[pmIndex + 1]) {
        packageManager = args[pmIndex + 1];
      }

      const success = await handleLocalBuild({ buildOnly, devOnly, packageManager }, config);
      if (!success) {
        process.exitCode = 1;
      }
      break;
    }

    case "remote":
    case "remote-build":
    case "build:remote":
    case "build-remote":
    case "deploy":
    case "publish":
    case "r": {
      let message: string | undefined;
      const msgIndex = args.findIndex((arg) => arg === "-m" || arg === "--message");
      if (msgIndex !== -1 && args[msgIndex + 1]) {
        message = args[msgIndex + 1];
      }

      const skipBuild = args.includes("--skip-build");

      let remote: string | undefined;
      const remoteIndex = args.findIndex((arg) => arg === "--remote");
      if (remoteIndex !== -1 && args[remoteIndex + 1]) {
        remote = args[remoteIndex + 1];
      }

      let branch: string | undefined;
      const branchIndex = args.findIndex(
        (arg) => arg === "--branch" || arg === "-B" || (arg === "-b" && !args.includes("-b") && false)
      );
      if (branchIndex !== -1 && args[branchIndex + 1]) {
        branch = args[branchIndex + 1];
      }

      let packageManager: string | undefined;
      const pmIndex = args.findIndex((arg) => arg === "--pm" || arg === "--package-manager");
      if (pmIndex !== -1 && args[pmIndex + 1]) {
        packageManager = args[pmIndex + 1];
      }

      const success = await handleRemoteBuild(
        { message, skipBuild, remote, branch, packageManager },
        config
      );
      if (!success) {
        process.exitCode = 1;
      }
      break;
    }

    case "push":
    case "git-push":
    case "git:push":
    case "gp":
    case "p":
    case "push-repo":
    case "push-github": {
      let message: string | undefined;
      const msgIndex = args.findIndex((arg) => arg === "-m" || arg === "--message");
      if (msgIndex !== -1 && args[msgIndex + 1]) {
        message = args[msgIndex + 1];
      }

      let remote: string | undefined;
      const remoteIndex = args.findIndex((arg) => arg === "--remote");
      if (remoteIndex !== -1 && args[remoteIndex + 1]) {
        remote = args[remoteIndex + 1];
      }

      let branch: string | undefined;
      const branchIndex = args.findIndex((arg) => arg === "--branch" || arg === "-b" || arg === "-B");
      if (branchIndex !== -1 && args[branchIndex + 1]) {
        branch = args[branchIndex + 1];
      }

      const success = await handleGitPush({ message, remote, branch }, config);
      if (!success) {
        process.exitCode = 1;
      }
      break;
    }

    case "get-docs":
    case "getdocs":
    case "get-posts":
    case "getposts":
    case "pull":
    case "git-pull":
    case "git:pull":
    case "fetch-docs":
    case "fetch-posts":
    case "sync-remote": {
      const safe = args.includes("--safe") || args.includes("--no-hard");
      const hard = args.includes("--hard") || !safe;

      let remote: string | undefined;
      const remoteIndex = args.findIndex((arg) => arg === "--remote");
      if (remoteIndex !== -1 && args[remoteIndex + 1]) {
        remote = args[remoteIndex + 1];
      }

      let branch: string | undefined;
      const branchIndex = args.findIndex((arg) => arg === "--branch" || arg === "-b" || arg === "-B");
      if (branchIndex !== -1 && args[branchIndex + 1]) {
        branch = args[branchIndex + 1];
      }

      const success = await handleGetPosts({ hard, remote, branch }, config);
      if (!success) {
        process.exitCode = 1;
      }
      break;
    }

    case "newpost":
    case "new":
    case "create":
    case "post":
    case "n": {
      const editTemplate = args.includes("--edit-template") || args.includes("-e");
      if (editTemplate) {
        await handleTemplateCommand({ edit: true }, config);
      }

      const fillSkipped = args.includes("--fill-skipped") || args.includes("-f");
      const today = args.includes("--today") || args.includes("-t");
      
      let dateValue: string | undefined;
      const dateIndex = args.findIndex((arg) => arg === "--date" || arg === "-d");
      if (dateIndex !== -1 && args[dateIndex + 1]) {
        dateValue = args[dateIndex + 1];
      }

      await handleNewPost(
        {
          fillSkipped: fillSkipped ? true : today ? false : undefined,
          today: today ? true : undefined,
          date: dateValue,
          editTemplate,
        },
        config
      );
      break;
    }

    case "template":
    case "template-edit":
    case "edit-template":
    case "tmpl":
    case "t": {
      const edit = args.includes("--edit") || args.includes("-e");
      const preview = args.includes("--preview") || args.includes("-p") || args.includes("--render");
      const view = args.includes("--view") || args.includes("-v") || args.includes("--show");
      const reset = args.includes("--reset") || args.includes("-r");
      const pathOnly = args.includes("--path");

      let editor: string | undefined;
      const editorIndex = args.findIndex((arg) => arg === "--editor");
      if (editorIndex !== -1 && args[editorIndex + 1]) {
        editor = args[editorIndex + 1];
      }

      let author: string | undefined;
      const authorIndex = args.findIndex((arg) => arg === "--author");
      if (authorIndex !== -1 && args[authorIndex + 1]) {
        author = args[authorIndex + 1];
      }

      let heroImage: string | undefined;
      const heroIndex = args.findIndex((arg) => arg === "--hero" || arg === "--hero-image");
      if (heroIndex !== -1 && args[heroIndex + 1]) {
        heroImage = args[heroIndex + 1];
      }

      let kofiUrl: string | undefined;
      const kofiIndex = args.findIndex((arg) => arg === "--kofi" || arg === "--kofi-url");
      if (kofiIndex !== -1 && args[kofiIndex + 1]) {
        kofiUrl = args[kofiIndex + 1];
      }

      let tldrThemePrefix: string | undefined;
      const tldrIndex = args.findIndex((arg) => arg === "--tldr");
      if (tldrIndex !== -1 && args[tldrIndex + 1]) {
        tldrThemePrefix = args[tldrIndex + 1];
      }

      let aboutAuthor: string | undefined;
      const aboutIndex = args.findIndex((arg) => arg === "--about");
      if (aboutIndex !== -1 && args[aboutIndex + 1]) {
        aboutAuthor = args[aboutIndex + 1];
      }

      await handleTemplateCommand(
        {
          edit,
          preview,
          view,
          reset,
          pathOnly,
          editor,
          author,
          heroImage,
          kofiUrl,
          tldrThemePrefix,
          aboutAuthor,
        },
        config
      );
      break;
    }

    case "movetovault":
    case "vault":
    case "move:vault":
    case "v": {
      handleMoveToVault(config);
      break;
    }

    case "movetobox":
    case "dropbox":
    case "box":
    case "move:box":
    case "b": {
      handleMoveToBox(config);
      break;
    }

    case "movetodrive":
    case "drive":
    case "gdrive":
    case "move:drive":
    case "d": {
      handleMoveToDrive(config);
      break;
    }

    case "movetodrivelinux":
    case "drivelinux":
    case "gdrive-linux":
    case "move:drivelinux":
    case "dl": {
      handleMoveToDriveLinux(config);
      break;
    }

    case "sync-all":
    case "movetoall":
    case "all":
    case "sync":
    case "a": {
      handleSyncAll(config);
      break;
    }

    case "status":
    case "info":
    case "check":
    case "stats":
    case "s": {
      handleStatus(config);
      break;
    }

    case "config":
    case "settings":
    case "setting":
    case "c": {
      const pathOnly = args.includes("--path") || args.includes("-p");
      handleConfigCommand({ pathOnly });
      break;
    }

    case "menu":
    case "interactive":
    case "tui":
    case "m":
    case "i": {
      await runInteractiveMenu();
      break;
    }

    case "help":
    case "--help":
    case "-h": {
      printHelp();
      break;
    }

    default: {
      console.error(c.red(`❌ Unknown command: "${command}"`));
      console.log(`Run ${c.cyan("bun run index.ts help")} to see all available commands.`);
      process.exitCode = 1;
      break;
    }
  }
}

main().catch((err) => {
  console.error(c.red(`\n❌ Fatal Error:`), err);
  process.exit(1);
});