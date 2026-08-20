# Artefaktas Docs 📚

Docusaurus-powered documentation hub and digital garden for [docs.artefaktas.eu](https://docs.artefaktas.eu).

---

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development Server

Start local dev server with live reload at `http://localhost:3000`:

```bash
npm start
```

### Production Build

Build static files into `./build`:

```bash
npm run build
```

Serve the production build locally:

```bash
npm run serve
```

---

## 🎛️ Blog & Site Control CLI (`console_control`)

A unified, high-performance Bun-powered CLI tool in [`console_control/`](./console_control) for automated post creation, template editing, builds, GitHub repository sync, and multi-destination backups.

### Quick Commands

```bash
# Launch interactive TUI menu
bun run cli
# or
npm run cli

# Check blog post status & destination backup health
bun run cli status

# Create a new blog post for today
bun run cli newpost --today

# Automatically detect and create post for first missing date
bun run cli newpost --fill-skipped

# Preview rendered Docusaurus post template
bun run cli template --preview

# Sync blog posts to all backup destinations (Obsidian, Dropbox, Google Drive)
bun run cli sync-all

# Pull / sync latest docs and posts from GitHub
bun run cli get-docs

# Build and push changes to GitHub
bun run cli remote -m "Update docs"
```

### CLI Command Reference

| Command | Aliases | Description |
|---|---|---|
| `local` | `start`, `dev`, `build:local`, `l` | Run Docusaurus build and launch dev server (`local.sh`) |
| `remote` | `build:remote`, `deploy`, `r` | Build site, stage changes, commit, and push to GitHub (`remote.sh`) |
| `push` | `git-push`, `git:push`, `gp`, `p` | Stage changes, commit, and push directly to GitHub |
| `get-docs` | `getdocs`, `get-posts`, `pull`, `git-pull` | Pull & hard reset/sync latest docs from GitHub (`get-docs.sh`) |
| `newpost` | `new`, `create`, `post` | Create a new blog post with frontmatter & increment support |
| `template` | `edit-template`, `tmpl`, `t` | View, edit in `$EDITOR`, preview, or reset post template |
| `movetovault` | `vault`, `v` | Copy posts to Obsidian Vault |
| `movetobox` | `dropbox`, `box`, `b` | Copy posts to Dropbox |
| `movetodrive` | `drive`, `gdrive`, `d` | Copy posts to Google Drive (ChromeOS `DOCS_STORAGE`) |
| `movetodrivelinux` | `drivelinux`, `gdrive-linux`, `dl` | Copy posts to Google Drive (Linux GVFS) |
| `sync-all` | `movetoall`, `all`, `sync` | Copy posts to ALL configured destinations |
| `status` | `info`, `stats`, `s` | Inspect blog & backup health |
| `config` | `settings`, `setting`, `c` | View configuration from `console_control/setting.json` |

---

## 📁 Project Structure

```
├── blog/                   # Blog posts (.md), authors.yml, tags.yml
├── docs/                   # Documentation markdown files
├── src/                    # Custom React components and CSS
├── static/                 # Static assets (images, favicon)
├── console_control/        # Bun CLI blog control and backup tool
├── docusaurus.config.js    # Docusaurus site configuration
├── sidebars.js             # Documentation sidebar configuration
├── wrangler.jsonc          # Cloudflare Pages deployment config
└── package.json            # Project dependencies and scripts
```

---

## ⚙️ Configuration & Customization

- **Blog & Backup Settings**: Configured in [`console_control/setting.json`](./console_control/setting.json).
- **Post Markdown Template**: Configured in [`console_control/template.md`](./console_control/template.md).
- **Authors & Tags**: Configured in [`blog/authors.yml`](./blog/authors.yml) and [`blog/tags.yml`](./blog/tags.yml).