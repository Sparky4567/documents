import fs from "node:fs";
import path from "node:path";
import type { AppConfig, DestinationPaths, PostTemplateConfig } from "./types.js";
import { resolvePath } from "./utils.js";

export const DEFAULT_TEMPLATE_CONTENT = `---
slug: {{slug}}
title: {{title}}
authors: [{{author}}]
tags: [newpost]
---

{{title}}

<!-- truncate -->

# {{title}}

> TLDR;

> {{tldrThemePrefix}}

Sveika, elektroerdve,



[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)]({{kofiUrl}})

Iki sekančio susiskaitymo.

Šis ekranas trumpam išsijungia, bet kažkur įsijungia kitas.

> Artefaktas docs.

> Thinking out loud, responsibly.

> Artefaktas.eu is a personal digital garden exploring technology, creativity, and the craft of building things online. Posts range from reflections on blogging tools and web frameworks to thoughts on AI, productivity, and digital minimalism — always with a mix of humor, curiosity, and hands-on experimentation.

> About author: {{aboutAuthor}}
`;

const DEFAULT_CONFIG: AppConfig = {
  blogDir: "../blog",
  destinations: {
    vault: "../vault",
    dropbox: "/home/cyber/Dropbox/blog_backup/",
    drive: "/mnt/chromeos/GoogleDrive/MyDrive/DOCS_STORAGE/",
    driveLinux: "/run/user/1000/gvfs/google-drive:host=gmail.com,user=andrius.pratusis1993/0ANY_aEQmVIShUk9PVA/1KRXQz5OABxzelY6ODTVZjjeSHovahz12/",
  },
  postTemplate: {
    templateFile: "template.md",
    heroImage: "https://www.dropbox.com/scl/fi/ozwb8141r9p1gegm74zk1/artefaktas_eu.jpg?rlkey=kex3z13fdg0eciums3driexp7&st=73a95se8&dl=1",
    tldrThemePrefix: "Šiandienos tema: ",
    author: "artefaktas",
    aboutAuthor: "I’m a creator-blogger driven by curiosity, blending writing, art, music, code, and the elegance of math and physics into everything I do.",
    kofiUrl: "https://ko-fi.com/K3K06VU8Z",
  },
};

/**
 * Returns the path to setting.json (or settings.json if present).
 */
export function getConfigPath(): string {
  if (process.env.BLOG_CONFIG_PATH) {
    return process.env.BLOG_CONFIG_PATH;
  }
  const rootDir = getConsoleControlDir();
  const settingPath = path.join(rootDir, "setting.json");
  const settingsPath = path.join(rootDir, "settings.json");

  if (fs.existsSync(settingPath)) {
    return settingPath;
  }
  if (fs.existsSync(settingsPath)) {
    return settingsPath;
  }
  return settingPath;
}

export function getConsoleControlDir(): string {
  return path.resolve(import.meta.dir, "..");
}

/**
 * Returns the absolute path to the project root directory (Docusaurus repo root).
 */
export function getProjectRootDir(config?: AppConfig): string {
  if (process.env.BLOG_PROJECT_ROOT) {
    return path.resolve(process.env.BLOG_PROJECT_ROOT);
  }
  if (config?.projectRoot) {
    return resolvePath(config.projectRoot, getConsoleControlDir());
  }
  return path.resolve(getConsoleControlDir(), "..");
}

/**
 * Returns the absolute path to the post template file (template.md).
 */
export function getTemplatePath(config?: AppConfig): string {
  const rootDir = path.resolve(import.meta.dir, "..");
  const templateFileName =
    config?.postTemplate?.templateFile || DEFAULT_CONFIG.postTemplate.templateFile || "template.md";
  if (path.isAbsolute(templateFileName)) {
    return templateFileName;
  }
  return path.resolve(rootDir, templateFileName);
}

/**
 * Loads the template content from file or fallback to DEFAULT_TEMPLATE_CONTENT.
 */
export function loadTemplateContent(config?: AppConfig): string {
  if (config?.postTemplate?.customTemplate) {
    return config.postTemplate.customTemplate;
  }

  const templatePath = getTemplatePath(config);
  if (fs.existsSync(templatePath)) {
    try {
      const content = fs.readFileSync(templatePath, "utf-8");
      if (content.trim().length > 0) {
        return content;
      }
    } catch {
      // Fallback below
    }
  }

  // If template file does not exist, initialize it
  try {
    fs.writeFileSync(templatePath, DEFAULT_TEMPLATE_CONTENT, "utf-8");
  } catch {
    // Ignore write failure and return default content
  }

  return DEFAULT_TEMPLATE_CONTENT;
}

/**
 * Saves template content to the configured template file.
 */
export function saveTemplateContent(content: string, config?: AppConfig): void {
  const templatePath = getTemplatePath(config);
  fs.writeFileSync(templatePath, content, "utf-8");
}

/**
 * Resets the template file to DEFAULT_TEMPLATE_CONTENT.
 */
export function resetTemplate(config?: AppConfig): void {
  saveTemplateContent(DEFAULT_TEMPLATE_CONTENT, config);
}

/**
 * Loads configuration from setting.json with robust fallbacks and normalization.
 */
export function loadConfig(): AppConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    // Write default config file if it does not exist
    try {
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
    } catch {
      // ignore write errors during load
    }
    return DEFAULT_CONFIG;
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);

    // Normalize destinations handling flat keys (e.g. dropbox_path, vault_path) and nested destinations
    const destinations: DestinationPaths = {
      vault: parsed.destinations?.vault || parsed.vault_path || parsed.vaultPath || parsed.vault || DEFAULT_CONFIG.destinations.vault,
      dropbox: parsed.destinations?.dropbox || parsed.dropbox_path || parsed.dropboxPath || parsed.dropbox || parsed.DROPBOX_PATH || DEFAULT_CONFIG.destinations.dropbox,
      drive: parsed.destinations?.drive || parsed.drive_path || parsed.drivePath || parsed.drive || parsed.DRIVE_PATH || DEFAULT_CONFIG.destinations.drive,
      driveLinux: parsed.destinations?.driveLinux || parsed.drive_linux_path || parsed.driveLinuxPath || parsed.drive_linux || DEFAULT_CONFIG.destinations.driveLinux,
      ...(parsed.destinations || {}),
    };

    const postTemplate: PostTemplateConfig = {
      templateFile: parsed.postTemplate?.templateFile || parsed.template_file || parsed.templateFile || DEFAULT_CONFIG.postTemplate.templateFile,
      heroImage: parsed.postTemplate?.heroImage || parsed.hero_image || DEFAULT_CONFIG.postTemplate.heroImage,
      tldrThemePrefix: parsed.postTemplate?.tldrThemePrefix || DEFAULT_CONFIG.postTemplate.tldrThemePrefix,
      author: parsed.postTemplate?.author || DEFAULT_CONFIG.postTemplate.author,
      aboutAuthor: parsed.postTemplate?.aboutAuthor || parsed.postTemplate?.about_author || DEFAULT_CONFIG.postTemplate.aboutAuthor,
      kofiUrl: parsed.postTemplate?.kofiUrl || parsed.postTemplate?.kofi_url || DEFAULT_CONFIG.postTemplate.kofiUrl,
      customTemplate: parsed.postTemplate?.customTemplate,
    };

    const blogDir = parsed.blogDir || parsed.blog_dir || DEFAULT_CONFIG.blogDir;
    const projectRoot = parsed.projectRoot || parsed.project_root || DEFAULT_CONFIG.projectRoot;
    const packageManager = parsed.packageManager || parsed.package_manager || parsed.pm || DEFAULT_CONFIG.packageManager;

    return {
      blogDir,
      destinations,
      postTemplate,
      projectRoot,
      packageManager,
    };
  } catch (error) {
    console.warn(`⚠️ Warning: Could not parse ${configPath}. Using defaults.`, error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Saves configuration to setting.json.
 */
export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}
