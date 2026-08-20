import fs from "node:fs";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import type { AppConfig, TemplateOptions } from "../types.js";
import {
  loadConfig,
  saveConfig,
  getTemplatePath,
  loadTemplateContent,
  saveTemplateContent,
  resetTemplate,
  DEFAULT_TEMPLATE_CONTENT,
} from "../config.js";
import { generatePostContent } from "./newpost.js";
import { c } from "../utils.js";

/**
 * Resolves the user's preferred text editor.
 */
export function getPreferredEditor(editorOverride?: string): string {
  if (editorOverride && editorOverride.trim().length > 0) {
    return editorOverride.trim();
  }
  if (process.env.VISUAL && process.env.VISUAL.trim().length > 0) {
    return process.env.VISUAL.trim();
  }
  if (process.env.EDITOR && process.env.EDITOR.trim().length > 0) {
    return process.env.EDITOR.trim();
  }

  if (process.platform === "win32") {
    return "notepad";
  }

  // Detect available editors on Unix
  const candidateEditors = ["nano", "vim", "vi", "code", "micro", "gedit", "emacs"];
  for (const ed of candidateEditors) {
    try {
      const check = spawnSync("which", [ed], { stdio: "ignore" });
      if (check.status === 0) {
        return ed;
      }
    } catch {
      // Continue searching
    }
  }

  return "nano";
}

/**
 * Opens the template file in the user's preferred text editor.
 */
export function openTemplateInEditor(
  editorOverride?: string,
  passedConfig?: AppConfig
): boolean {
  const config = passedConfig ?? loadConfig();
  const templatePath = getTemplatePath(config);

  // Ensure template file exists before opening
  loadTemplateContent(config);

  const editor = getPreferredEditor(editorOverride);
  console.log(`\n🚀 Opening template file in ${c.bold(c.cyan(editor))}:`);
  console.log(`   ${c.dim(templatePath)}\n`);

  try {
    const result = spawnSync(`${editor} "${templatePath}"`, {
      stdio: "inherit",
      shell: true,
    });

    if (result.error) {
      console.error(c.red(`\n❌ Failed to launch editor "${editor}":`), result.error.message);
      return false;
    }

    if (result.status === 0) {
      console.log(c.green(`\n✅ Template successfully updated: ${c.dim(templatePath)}`));
      return true;
    } else {
      console.log(c.yellow(`\n⚠️ Editor exited with status code ${result.status}.`));
      return false;
    }
  } catch (err) {
    console.error(c.red(`\n❌ Error opening editor:`), err);
    return false;
  }
}

/**
 * Displays raw unparsed template content.
 */
export function viewRawTemplate(passedConfig?: AppConfig): void {
  const config = passedConfig ?? loadConfig();
  const templatePath = getTemplatePath(config);
  const raw = loadTemplateContent(config);

  console.log(c.bold(c.cyan("\n📄 Raw Template Content:")));
  console.log(`Location: ${c.dim(templatePath)}\n`);
  console.log(c.dim("--------------------------------------------------"));
  console.log(raw);
  console.log(c.dim("--------------------------------------------------"));
  console.log(c.dim("\nAvailable placeholders:"));
  console.log(`  ${c.cyan("{{title}}")} or ${c.cyan("{{stem}}")}       - Post filename stem (e.g. 2026-08-20)`);
  console.log(`  ${c.cyan("{{pubDate}}")} or ${c.cyan("{{date}}")}     - Post ISO publish date`);
  console.log(`  ${c.cyan("{{heroImage}}")}             - Hero image URL`);
  console.log(`  ${c.cyan("{{author}}")}                - Author name`);
  console.log(`  ${c.cyan("{{aboutAuthor}}")}           - Author bio / about text`);
  console.log(`  ${c.cyan("{{kofiUrl}}")}               - Ko-Fi donation link`);
  console.log(`  ${c.cyan("{{tldrThemePrefix}}")}       - Prefix for TLDR theme section\n`);
}

/**
 * Displays rendered preview of the template with current config.
 */
export function previewTemplate(passedConfig?: AppConfig): void {
  const config = passedConfig ?? loadConfig();
  const today = new Date();
  const stem = "2026-08-20";
  const rendered = generatePostContent(today, stem, config);

  console.log(c.bold(c.magenta("\n👁️  Rendered Template Preview (Example Date):")));
  console.log(c.dim("--------------------------------------------------"));
  console.log(rendered);
  console.log(c.dim("--------------------------------------------------\n"));
}

/**
 * Resets template to default content.
 */
export function resetTemplateCommand(passedConfig?: AppConfig): void {
  const config = passedConfig ?? loadConfig();
  const templatePath = getTemplatePath(config);
  resetTemplate(config);
  console.log(c.green(`\n✅ Template reset to default content at: ${c.dim(templatePath)}\n`));
}

/**
 * Interactively edit template variables in setting.json.
 */
export async function editTemplateFieldsInteractive(
  existingRl?: readline.Interface,
  passedConfig?: AppConfig
): Promise<void> {
  const rl =
    existingRl ??
    readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  const shouldCloseRl = !existingRl;

  const config = passedConfig ?? loadConfig();

  try {
    console.log(c.bold(c.cyan("\n🏷️  Edit Template Metadata Variables:")));
    console.log(c.dim("Press Enter to keep current value.\n"));

    const authorInput = await rl.question(
      `Author [${c.yellow(config.postTemplate.author)}]: `
    );
    if (authorInput.trim()) {
      config.postTemplate.author = authorInput.trim();
    }

    const heroInput = await rl.question(
      `Hero Image URL [${c.yellow(config.postTemplate.heroImage)}]: `
    );
    if (heroInput.trim()) {
      config.postTemplate.heroImage = heroInput.trim();
    }

    const kofiInput = await rl.question(
      `Ko-Fi URL [${c.yellow(config.postTemplate.kofiUrl)}]: `
    );
    if (kofiInput.trim()) {
      config.postTemplate.kofiUrl = kofiInput.trim();
    }

    const tldrInput = await rl.question(
      `TLDR Theme Prefix [${c.yellow(config.postTemplate.tldrThemePrefix)}]: `
    );
    if (tldrInput.trim()) {
      config.postTemplate.tldrThemePrefix = tldrInput.trim();
    }

    const aboutInput = await rl.question(
      `About Author [${c.yellow(config.postTemplate.aboutAuthor)}]: `
    );
    if (aboutInput.trim()) {
      config.postTemplate.aboutAuthor = aboutInput.trim();
    }

    const templateFileInput = await rl.question(
      `Template File Name/Path [${c.yellow(config.postTemplate.templateFile || "template.md")}]: `
    );
    if (templateFileInput.trim()) {
      config.postTemplate.templateFile = templateFileInput.trim();
    }

    saveConfig(config);
    console.log(c.green("\n✅ Template settings saved successfully to setting.json!\n"));
  } finally {
    if (shouldCloseRl) {
      rl.close();
    }
  }
}

/**
 * Interactive template submenu loop.
 */
export async function runInteractiveTemplateMenu(
  existingRl?: readline.Interface
): Promise<void> {
  const rl =
    existingRl ??
    readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  const shouldCloseRl = !existingRl;

  try {
    while (true) {
      const config = loadConfig();
      const editorName = getPreferredEditor();
      const templatePath = getTemplatePath(config);

      console.log(c.bold(c.cyan("\n==================================================")));
      console.log(c.bold(c.cyan("         📝 NEWPOST TEMPLATE MANAGEMENT          ")));
      console.log(c.bold(c.cyan("==================================================")));
      console.log(`Template file: ${c.dim(templatePath)}`);
      console.log(`Default editor: ${c.yellow(editorName)}`);
      console.log(c.dim("--------------------------------------------------"));
      console.log(` ${c.bold(c.green("1"))}) ✏️  Edit template markdown file (${c.cyan(editorName)})`);
      console.log(` ${c.bold(c.green("2"))}) 🏷️  Edit template metadata variables (Author, Hero, Ko-Fi...)`);
      console.log(` ${c.bold(c.green("3"))}) 👁️  Preview rendered template (with current date & settings)`);
      console.log(` ${c.bold(c.green("4"))}) 📄 View raw template file (with placeholders)`);
      console.log(` ${c.bold(c.yellow("5"))}) 🔄 Reset template to default`);
      console.log(` ${c.bold(c.red("0"))}) 🔙 Back to main menu`);
      console.log(c.bold(c.cyan("==================================================")));

      const choice = (await rl.question(c.bold("\nEnter choice [0-5]: "))).trim();

      switch (choice) {
        case "1":
          openTemplateInEditor(undefined, config);
          break;
        case "2":
          await editTemplateFieldsInteractive(rl, config);
          break;
        case "3":
          previewTemplate(config);
          break;
        case "4":
          viewRawTemplate(config);
          break;
        case "5": {
          const confirm = await rl.question(
            c.yellow("⚠️ Are you sure you want to reset the template to default? (y/n): ")
          );
          if (confirm.trim().toLowerCase().startsWith("y")) {
            resetTemplateCommand(config);
          } else {
            console.log(c.dim("Reset cancelled."));
          }
          break;
        }
        case "0":
        case "b":
        case "back":
        case "q":
          return;
        default:
          console.log(c.red("\n❌ Invalid option. Please choose a number from 0 to 5."));
      }

      await rl.question(c.dim("\nPress Enter to continue..."));
    }
  } finally {
    if (shouldCloseRl) {
      rl.close();
    }
  }
}

/**
 * Main command handler for template operations.
 */
export async function handleTemplateCommand(
  options: TemplateOptions = {},
  passedConfig?: AppConfig
): Promise<void> {
  const config = passedConfig ?? loadConfig();

  if (options.pathOnly) {
    console.log(getTemplatePath(config));
    return;
  }

  if (options.reset) {
    resetTemplateCommand(config);
    return;
  }

  if (options.view) {
    viewRawTemplate(config);
    return;
  }

  if (options.preview) {
    previewTemplate(config);
    return;
  }

  // Handle setting specific fields from CLI options if any
  let hasFieldUpdates = false;
  if (options.author !== undefined) {
    config.postTemplate.author = options.author;
    hasFieldUpdates = true;
  }
  if (options.heroImage !== undefined) {
    config.postTemplate.heroImage = options.heroImage;
    hasFieldUpdates = true;
  }
  if (options.kofiUrl !== undefined) {
    config.postTemplate.kofiUrl = options.kofiUrl;
    hasFieldUpdates = true;
  }
  if (options.tldrThemePrefix !== undefined) {
    config.postTemplate.tldrThemePrefix = options.tldrThemePrefix;
    hasFieldUpdates = true;
  }
  if (options.aboutAuthor !== undefined) {
    config.postTemplate.aboutAuthor = options.aboutAuthor;
    hasFieldUpdates = true;
  }
  if (options.templateFile !== undefined) {
    config.postTemplate.templateFile = options.templateFile;
    hasFieldUpdates = true;
  }

  if (hasFieldUpdates) {
    saveConfig(config);
    console.log(c.green("✅ Template settings updated in setting.json"));
    return;
  }

  if (options.edit) {
    openTemplateInEditor(options.editor, config);
    return;
  }

  // Default: if in interactive terminal, open the template menu
  if (process.stdin.isTTY) {
    await runInteractiveTemplateMenu();
  } else {
    // If non-interactive, display raw template
    viewRawTemplate(config);
  }
}
