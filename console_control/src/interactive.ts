import readline from "node:readline/promises";
import { loadConfig } from "./config.js";
import { handleNewPost } from "./commands/newpost.js";
import {
  handleMoveToVault,
  handleMoveToBox,
  handleMoveToDrive,
  handleMoveToDriveLinux,
  handleSyncAll,
} from "./commands/sync.js";
import { handleStatus } from "./commands/status.js";
import { handleConfigCommand } from "./commands/config-cmd.js";
import { runInteractiveTemplateMenu } from "./commands/template-cmd.js";
import {
  handleLocalBuild,
  handleRemoteBuild,
  handleGitPush,
  handleGetPosts,
} from "./commands/build-git.js";
import { c } from "./utils.js";

/**
 * Runs the interactive CLI menu loop.
 */
export async function runInteractiveMenu(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const config = loadConfig();

  try {
    while (true) {
      console.log(c.bold(c.cyan("\n==================================================")));
      console.log(c.bold(c.cyan("     🎛️  ARTEFAKTAS DOCS CONTROL CLI (BUN)        ")));
      console.log(c.bold(c.cyan("==================================================")));
      console.log(` ${c.bold(c.green("1"))}) 📝 Create new post (interactive prompt)`);
      console.log(` ${c.bold(c.green("2"))}) ⏩ Create new post (fill skipped dates)`);
      console.log(` ${c.bold(c.green("3"))}) 📅 Create new post (for today)`);
      console.log(c.dim("--------------------------------------------------"));
      console.log(` ${c.bold(c.blue("4"))}) 📦 Copy to Obsidian Vault (${c.dim("movetovault")})`);
      console.log(` ${c.bold(c.blue("5"))}) ☁️  Copy to Dropbox (${c.dim("movetobox")})`);
      console.log(` ${c.bold(c.blue("6"))}) 💾 Copy to Google Drive - ChromeOS (${c.dim("movetodrive")})`);
      console.log(` ${c.bold(c.blue("7"))}) 🐧 Copy to Google Drive - Linux GVFS (${c.dim("movetodrivelinux")})`);
      console.log(` ${c.bold(c.magenta("8"))}) 🚀 Copy to ALL destinations (${c.dim("sync-all")})`);
      console.log(c.dim("--------------------------------------------------"));
      console.log(` ${c.bold(c.yellow("9"))}) 📊 View blog status & destination health`);
      console.log(` ${c.bold(c.yellow("10"))}) ⚙️  View settings (${c.dim("setting.json")})`);
      console.log(` ${c.bold(c.magenta("11"))}) 📝 Edit newpost template (${c.dim("Markdown & fields")})`);
      console.log(c.dim("--------------------------------------------------"));
      console.log(` ${c.bold(c.cyan("12"))}) 🛠️  Local build & start dev server (${c.dim("local")})`);
      console.log(` ${c.bold(c.cyan("13"))}) 🚀 Remote build & push to GitHub (${c.dim("remote")})`);
      console.log(` ${c.bold(c.cyan("14"))}) 📤 Push changes to GitHub repository (${c.dim("push")})`);
      console.log(` ${c.bold(c.cyan("15"))}) 📥 Pull docs / posts from GitHub (${c.dim("get-docs")})`);
      console.log(` ${c.bold(c.red("0"))}) 🚪 Exit`);
      console.log(c.bold(c.cyan("==================================================")));

      const choice = (await rl.question(c.bold("\nEnter choice [0-15]: "))).trim();

      switch (choice) {
        case "1":
          console.log("");
          await handleNewPost({}, config);
          break;
        case "2":
          console.log("");
          await handleNewPost({ fillSkipped: true }, config);
          break;
        case "3":
          console.log("");
          await handleNewPost({ today: true }, config);
          break;
        case "4":
          console.log("");
          handleMoveToVault(config);
          break;
        case "5":
          console.log("");
          handleMoveToBox(config);
          break;
        case "6":
          console.log("");
          handleMoveToDrive(config);
          break;
        case "7":
          console.log("");
          handleMoveToDriveLinux(config);
          break;
        case "8":
          console.log("");
          handleSyncAll(config);
          break;
        case "9":
          console.log("");
          handleStatus(config);
          break;
        case "10":
          console.log("");
          handleConfigCommand();
          break;
        case "11":
          console.log("");
          await runInteractiveTemplateMenu(rl);
          break;
        case "12": {
          console.log("");
          const buildMode = (
            await rl.question("Run full build + dev server? ([y]es / [b]uild only / [c]ancel): ")
          )
            .trim()
            .toLowerCase();
          if (buildMode === "c" || buildMode === "cancel") {
            console.log("Cancelled.");
          } else if (buildMode === "b" || buildMode === "build") {
            await handleLocalBuild({ buildOnly: true }, config);
          } else {
            await handleLocalBuild({}, config);
          }
          break;
        }
        case "13": {
          console.log("");
          const msg = (
            await rl.question('Commit message (leave empty for "rebuild"): ')
          ).trim();
          await handleRemoteBuild({ message: msg || "rebuild" }, config);
          break;
        }
        case "14": {
          console.log("");
          const msg = (
            await rl.question('Commit message (leave empty for "rebuild"): ')
          ).trim();
          await handleGitPush({ message: msg || "rebuild" }, config);
          break;
        }
        case "15": {
          console.log("");
          const hardAns = (
            await rl.question("Force hard reset to match origin/main? ([y]es / [n]o safe pull): ")
          )
            .trim()
            .toLowerCase();
          const isHard = !hardAns.startsWith("n");
          await handleGetPosts({ hard: isHard }, config);
          break;
        }
        case "0":
        case "q":
        case "exit":
          console.log(c.green("\n👋 Goodbye!\n"));
          return;
        default:
          console.log(c.red("\n❌ Invalid option. Please choose a number from 0 to 15."));
      }

      await rl.question(c.dim("\nPress Enter to return to menu..."));
    }
  } finally {
    rl.close();
  }
}
