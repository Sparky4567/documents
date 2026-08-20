import fs from "node:fs";
import type { AppConfig } from "../types.js";
import { loadConfig, getConfigPath, getTemplatePath } from "../config.js";
import { resolvePath, c } from "../utils.js";

/**
 * Displays current configuration from setting.json.
 */
export function handleConfigCommand(options: { pathOnly?: boolean } = {}): void {
  const configPath = getConfigPath();

  if (options.pathOnly) {
    console.log(configPath);
    return;
  }

  const config = loadConfig();
  const templatePath = getTemplatePath(config);

  console.log(c.bold(c.cyan("\n⚙️  Configuration (setting.json)\n")));
  console.log(`Config File: ${c.dim(configPath)}\n`);

  console.log(c.bold(c.blue("Blog Directory:")));
  console.log(`  Setting:  ${config.blogDir}`);
  console.log(`  Resolved: ${c.dim(resolvePath(config.blogDir))}\n`);

  console.log(c.bold(c.blue("Destinations:")));
  for (const [key, val] of Object.entries(config.destinations)) {
    console.log(`  • ${c.bold(key)}:`);
    console.log(`    Config:   ${val}`);
    console.log(`    Resolved: ${c.dim(resolvePath(val))}`);
  }

  console.log(c.bold(c.blue("\nPost Template:")));
  console.log(`  • Template File: ${config.postTemplate.templateFile || "template.md"} (${c.dim(templatePath)})`);
  console.log(`  • Hero Image:    ${config.postTemplate.heroImage}`);
  console.log(`  • Author:        ${config.postTemplate.author}`);
  console.log(`  • Ko-Fi URL:     ${config.postTemplate.kofiUrl}`);
  console.log(`  • TLDR Prefix:   ${config.postTemplate.tldrThemePrefix}\n`);
}
