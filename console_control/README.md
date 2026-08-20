# console_control 🎛️

A unified, high-performance Bun-powered CLI control tool for **Artefaktas Docs (Docusaurus)** blog management and multi-destination backups. Replaces and enhances all Python scripts in `python_scripts_portable`.

---

## ⚡ Features

- **Local & Remote Build Pipelines**:
  - **Local Build & Dev (`local`)**: Runs Docusaurus build and launches development server (replaces `local.sh` / `local.bat`).
  - **Remote Build & Deploy (`remote`)**: Builds project, stages changes, commits with custom or default message, and pushes to remote (replaces `remote.sh` / `remote.bat`).
  - **Direct Git Push (`push`)**: Stages changes, commits, and pushes to GitHub repository.
  - **Pull & Sync Docs (`get-docs` / `get-posts`)**: Synchronizes / resets latest blog posts and docs from GitHub (replaces `get-docs.sh` / `get-posts.sh`).
- **Interactive Console Menu (TUI)**: Launch an easy-to-use menu by running without arguments (`bun start`).
- **Automated Post Creation (`newpost`)**:
  - Automatically detects missing dates and fills gaps sequentially.
  - Supports automatic numeric suffix incrementing (`YYYY-MM-DD_1.md`, `YYYY-MM-DD_2.md`) if a post on the same day already exists.
  - Generates standard Docusaurus frontmatter (`slug`, `title`, `authors`, `tags`, `<!-- truncate -->`).
- **Customizable Post Template (`template`)**:
  - Full template editing via your favorite text editor (`$EDITOR`, `nano`, `vim`, `code`).
  - Interactive variable updates (Author, Hero image, Ko-Fi URL, TLDR prefix, About text).
  - Live rendered preview and raw template inspection.
  - Reset to default template anytime.
- **Backup & Synchronization**:
  - **Vault**: Obsidian vault backup (`movetovault`).
  - **Dropbox**: Backup to Dropbox (`movetobox`).
  - **Google Drive (ChromeOS)**: Backup to Google Drive mount (`movetodrive`).
  - **Google Drive (Linux GVFS)**: Backup to Linux GVFS Google Drive mount (`movetodrivelinux`).
  - **Sync All (`sync-all`)**: Single-command sync to all configured destinations with summary metrics.
- **Blog & Health Status (`status`)**:
  - Displays total post count, latest post date, and missing date checks.
  - Tests reachability and sync difference of all configured backup targets.
- **Configuration Management (`setting.json`)**:
  - Centralized settings for source paths, target destinations, and blog templates.

---

## 🚀 Quick Start

### Installation

```bash
cd console_control
bun install
```

### Interactive Menu

Run without arguments to open the interactive menu:

```bash
bun start
# or
bun run index.ts
```

---

## 🛠️ CLI Commands & Usage

| Command | Aliases | Description |
|---|---|---|
| `local` | `local-build`, `build:local`, `start`, `dev`, `l` | Build Docusaurus project & launch local dev server (`local.sh`) |
| `remote` | `remote-build`, `build:remote`, `deploy`, `r` | Build project, stage, commit & push to GitHub (`remote.sh`) |
| `push` | `git-push`, `git:push`, `gp`, `p` | Stage changes, commit & push to GitHub repository |
| `get-docs` | `getdocs`, `get-posts`, `pull`, `git-pull` | Pull & sync latest docs/posts from GitHub (`get-docs.sh`) |
| `newpost` | `new`, `create`, `post` | Create a new blog post |
| `template` | `edit-template`, `tmpl`, `t` | View, edit, preview, or reset post template |
| `movetovault` | `vault`, `v` | Copy posts to Obsidian Vault |
| `movetobox` | `dropbox`, `box`, `b` | Copy posts to Dropbox |
| `movetodrive` | `drive`, `gdrive`, `d` | Copy posts to Google Drive (ChromeOS `DOCS_STORAGE`) |
| `movetodrivelinux` | `drivelinux`, `gdrive-linux`, `dl` | Copy posts to Google Drive (Linux GVFS) |
| `sync-all` | `movetoall`, `all`, `sync` | Copy posts to ALL destinations |
| `status` | `info`, `stats`, `s` | Inspect blog & backup health |
| `config` | `settings`, `setting`, `c` | View configuration from `setting.json` |
| `help` | `--help`, `-h` | Display help and usage examples |

---

### Command Examples

#### 1. Local Build & Development Server (`local.sh`)

```bash
# Run local Docusaurus build followed by development server
bun run index.ts local
# or via npm script
bun run local

# Run build step only without starting dev server
bun run index.ts local --build-only
# or shorthand
bun run index.ts local -b

# Start development server directly
bun run index.ts local --dev-only
```

#### 2. Remote Build & Deploy to GitHub (`remote.sh`)

```bash
# Build Docusaurus project, stage changes, commit with default message ("rebuild"), and push
bun run index.ts remote
# or via npm script
bun run remote

# Deploy with custom commit message
bun run index.ts remote -m "Add article for 2026-08-20"

# Skip build step and only commit & push
bun run index.ts remote --skip-build -m "Fix typo"
```

#### 3. Direct Push to GitHub Repository

```bash
# Stage all changes, commit, and push
bun run index.ts push -m "Update blog backup links"
```

#### 4. Pull / Sync Docs & Posts from GitHub (`get-docs.sh`)

```bash
# Pull and hard-reset local branch to match origin/main
bun run index.ts get-docs
# or alias
bun run index.ts get-posts

# Safe pull without hard reset
bun run index.ts get-docs --safe
```

#### 5. Create a New Blog Post

```bash
# Interactive prompt: asks whether to fill missing dates
bun run index.ts newpost

# Automatically detect and create post for the first missing date
bun run index.ts newpost --fill-skipped
# or shorthand
bun run index.ts newpost -f

# Create post for today without prompt
bun run index.ts newpost --today
# or shorthand
bun run index.ts newpost -t

# Create post for a specific date
bun run index.ts newpost --date 2026-08-20
```

#### 6. Manage & Edit Post Template

```bash
# Open template in your default editor ($EDITOR / nano / vim / code)
bun run index.ts template --edit

# Specify a custom editor to open the template with
bun run index.ts template --edit --editor vim

# Preview rendered template with current settings & example date
bun run index.ts template --preview

# View raw template markdown with placeholders
bun run index.ts template --view

# Reset template back to default
bun run index.ts template --reset

# Interactively edit template variables (Author, Hero image, Ko-Fi URL)
bun run index.ts template --author "artefaktas" --hero "https://example.com/hero.jpg"
```

##### 📌 Available Placeholders in `template.md`:

| Placeholder | Description | Example Replacement |
|---|---|---|
| `{{title}}` / `{{stem}}` | Post filename stem / Title | `2026-08-20` |
| `{{slug}}` | Post slug URL identifier | `2026-08-20` |
| `{{pubDate}}` / `{{date}}` | Publication ISO date | `2026-08-20` |
| `{{heroImage}}` | Hero image URL from settings | `https://example.com/hero.jpg` |
| `{{author}}` | Author identifier from settings | `artefaktas` |
| `{{aboutAuthor}}` | Author bio text from settings | `I'm a creator-blogger...` |
| `{{kofiUrl}}` | Ko-Fi link from settings | `https://ko-fi.com/...` |
| `{{tldrThemePrefix}}` | TLDR prefix from settings | `Šiandienos tema: ` |

#### 7. Backup to Destinations

```bash
# Copy to Obsidian Vault
bun run index.ts movetovault

# Copy to Dropbox
bun run index.ts movetobox

# Copy to Google Drive (ChromeOS mount DOCS_STORAGE)
bun run index.ts movetodrive

# Copy to Google Drive (Linux GVFS)
bun run index.ts movetodrivelinux

# Synchronize across all destinations at once
bun run index.ts sync-all
```

#### 8. View Blog & Backup Health

```bash
bun run index.ts status
```

#### 9. View Configuration

```bash
bun run index.ts config
```

---

## ⚙️ Configuration (`setting.json`)

All paths and templates are managed in `setting.json`:

```json
{
  "blogDir": "../blog",
  "destinations": {
    "vault": "../vault",
    "dropbox": "/home/cyber/Dropbox/blog_backup/",
    "drive": "/mnt/chromeos/GoogleDrive/MyDrive/DOCS_STORAGE/",
    "driveLinux": "/run/user/1000/gvfs/google-drive:host=gmail.com,user=andrius.pratusis1993/0ANY_aEQmVIShUk9PVA/1KRXQz5OABxzelY6ODTVZjjeSHovahz12/"
  },
  "postTemplate": {
    "templateFile": "template.md",
    "heroImage": "https://www.dropbox.com/scl/fi/ozwb8141r9p1gegm74zk1/artefaktas_eu.jpg?rlkey=kex3z13fdg0eciums3driexp7&st=73a95se8&dl=1",
    "tldrThemePrefix": "Šiandienos tema: ",
    "author": "artefaktas",
    "aboutAuthor": "I’m a creator-blogger driven by curiosity, blending writing, art, music, code, and the elegance of math and physics into everything I do.",
    "kofiUrl": "https://ko-fi.com/K3K06VU8Z"
  }
}
```

---

## 🧪 Testing

Run test suite with Bun's built-in test runner:

```bash
bun test
```
