import { describe, it, expect } from "bun:test";
import fs from "node:fs";
import { loadConfig, getConfigPath } from "../config.js";

describe("Config tests", () => {
  it("should find and load setting.json", () => {
    const configPath = getConfigPath();
    expect(configPath).toContain("setting.json");
    expect(fs.existsSync(configPath)).toBe(true);

    const config = loadConfig();
    expect(config.blogDir).toBe("../blog");
    expect(config.destinations.vault).toBe("../vault");
    expect(config.destinations.dropbox).toBe("/home/cyber/Dropbox/blog_backup/");
    expect(config.destinations.drive).toBe("/mnt/chromeos/GoogleDrive/MyDrive/DOCS_STORAGE/");
    expect(config.destinations.driveLinux).toBe(
      "/run/user/1000/gvfs/google-drive:host=gmail.com,user=andrius.pratusis1993/0ANY_aEQmVIShUk9PVA/1KRXQz5OABxzelY6ODTVZjjeSHovahz12/"
    );
    expect(config.postTemplate.author).toBe("artefaktas");
  });
});
