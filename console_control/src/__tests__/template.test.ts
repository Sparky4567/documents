import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  DEFAULT_TEMPLATE_CONTENT,
  getTemplatePath,
  loadTemplateContent,
  saveTemplateContent,
  resetTemplate,
} from "../config.js";
import { renderTemplate, generatePostContent } from "../commands/newpost.js";
import {
  getPreferredEditor,
  handleTemplateCommand,
} from "../commands/template-cmd.js";
import type { AppConfig } from "../types.js";

describe("Template management tests", () => {
  let tempDir: string;
  let customTemplatePath: string;
  let mockConfig: AppConfig;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-template-test-"));
    process.env.BLOG_CONFIG_PATH = path.join(tempDir, "setting.json");
    customTemplatePath = path.join(tempDir, "custom-template.md");
    mockConfig = {
      blogDir: tempDir,
      destinations: {
        vault: "",
        dropbox: "",
        drive: "",
        driveLinux: "",
      },
      postTemplate: {
        templateFile: customTemplatePath,
        heroImage: "https://example.com/hero.jpg",
        tldrThemePrefix: "Topic: ",
        author: "Tester",
        aboutAuthor: "About Tester",
        kofiUrl: "https://ko-fi.com/tester",
      },
    };
  });

  afterEach(() => {
    delete process.env.BLOG_CONFIG_PATH;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should return correct template path", () => {
    const p = getTemplatePath(mockConfig);
    expect(p).toBe(customTemplatePath);
  });

  it("should initialize and return DEFAULT_TEMPLATE_CONTENT if template file does not exist", () => {
    expect(fs.existsSync(customTemplatePath)).toBe(false);
    const content = loadTemplateContent(mockConfig);
    expect(content).toBe(DEFAULT_TEMPLATE_CONTENT);
    expect(fs.existsSync(customTemplatePath)).toBe(true);
  });

  it("should save and load updated template content", () => {
    const customContent = "# Custom Post Template\n\nTitle: {{title}}\nAuthor: {{author}}";
    saveTemplateContent(customContent, mockConfig);
    expect(loadTemplateContent(mockConfig)).toBe(customContent);
  });

  it("should reset template back to default content", () => {
    const customContent = "Temporary modified template";
    saveTemplateContent(customContent, mockConfig);
    expect(loadTemplateContent(mockConfig)).toBe(customContent);

    resetTemplate(mockConfig);
    expect(loadTemplateContent(mockConfig)).toBe(DEFAULT_TEMPLATE_CONTENT);
  });

  it("should render template with all placeholder substitutions", () => {
    const templateStr = `---
title: "{{title}}"
pubDate: "{{pubDate}}"
hero: "{{heroImage}}"
---
# {{stem}}
Date: {{date}}
Author: {{author}} ({{aboutAuthor}})
Ko-Fi: {{kofiUrl}}
TLDR: {{tldrThemePrefix}}Custom TLDR`;

    const rendered = renderTemplate(templateStr, {
      title: "2026-08-20",
      stem: "2026-08-20",
      pubDate: "2026-08-20",
      date: "2026-08-20",
      heroImage: "https://example.com/test.jpg",
      author: "Test User",
      aboutAuthor: "Bio text",
      kofiUrl: "https://ko-fi.com/test",
      tldrThemePrefix: "Theme: ",
    });

    expect(rendered).toContain('title: "2026-08-20"');
    expect(rendered).toContain('pubDate: "2026-08-20"');
    expect(rendered).toContain('hero: "https://example.com/test.jpg"');
    expect(rendered).toContain("# 2026-08-20");
    expect(rendered).toContain("Date: 2026-08-20");
    expect(rendered).toContain("Author: Test User (Bio text)");
    expect(rendered).toContain("Ko-Fi: https://ko-fi.com/test");
    expect(rendered).toContain("TLDR: Theme: Custom TLDR");
  });

  it("should generate post content using the custom template file", () => {
    const customTemplate = `---
title: "{{title}}"
pubDate: "{{pubDate}}"
---
Custom Body by {{author}}
KoFi: {{kofiUrl}}`;
    saveTemplateContent(customTemplate, mockConfig);

    const targetDate = new Date("2026-08-20T12:00:00Z");
    const postContent = generatePostContent(targetDate, "2026-08-20", mockConfig);

    expect(postContent).toContain('title: "2026-08-20"');
    expect(postContent).toContain('pubDate: "2026-08-20"');
    expect(postContent).toContain("Custom Body by Tester");
    expect(postContent).toContain("KoFi: https://ko-fi.com/tester");
  });

  it("should resolve preferred editor from override, env vars, or defaults", () => {
    expect(getPreferredEditor("code")).toBe("code");
    expect(getPreferredEditor("nano -w")).toBe("nano -w");

    const origVisual = process.env.VISUAL;
    const origEditor = process.env.EDITOR;

    process.env.VISUAL = "custom-editor";
    expect(getPreferredEditor()).toBe("custom-editor");
    delete process.env.VISUAL;

    process.env.EDITOR = "another-editor";
    expect(getPreferredEditor()).toBe("another-editor");

    // Restore
    if (origVisual) process.env.VISUAL = origVisual;
    else delete process.env.VISUAL;

    if (origEditor) process.env.EDITOR = origEditor;
    else delete process.env.EDITOR;
  });

  it("should handle handleTemplateCommand with options", async () => {
    // Reset option
    await handleTemplateCommand({ reset: true }, mockConfig);
    expect(loadTemplateContent(mockConfig)).toBe(DEFAULT_TEMPLATE_CONTENT);

    // Field updates
    await handleTemplateCommand(
      {
        author: "New Author",
        heroImage: "https://example.com/new.png",
        kofiUrl: "https://ko-fi.com/new",
        tldrThemePrefix: "New theme: ",
        aboutAuthor: "New bio",
      },
      mockConfig
    );

    expect(mockConfig.postTemplate.author).toBe("New Author");
    expect(mockConfig.postTemplate.heroImage).toBe("https://example.com/new.png");
    expect(mockConfig.postTemplate.kofiUrl).toBe("https://ko-fi.com/new");
    expect(mockConfig.postTemplate.tldrThemePrefix).toBe("New theme: ");
    expect(mockConfig.postTemplate.aboutAuthor).toBe("New bio");
  });
});
