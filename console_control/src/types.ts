export interface DestinationPaths {
  vault: string;
  dropbox: string;
  drive: string;
  driveLinux: string;
  [key: string]: string;
}

export interface PostTemplateConfig {
  templateFile?: string;
  heroImage: string;
  tldrThemePrefix: string;
  author: string;
  aboutAuthor: string;
  kofiUrl: string;
  customTemplate?: string;
}

export interface AppConfig {
  blogDir: string;
  destinations: DestinationPaths;
  postTemplate: PostTemplateConfig;
  projectRoot?: string;
  packageManager?: "npm" | "bun" | "pnpm" | "yarn" | string;
}

export interface BuildOptions {
  packageManager?: "npm" | "bun" | "pnpm" | "yarn" | string;
  buildOnly?: boolean;
  devOnly?: boolean;
  cwd?: string;
}

export interface RemoteBuildOptions {
  packageManager?: "npm" | "bun" | "pnpm" | "yarn" | string;
  message?: string;
  skipBuild?: boolean;
  remote?: string;
  branch?: string;
  cwd?: string;
}

export interface GitPushOptions {
  message?: string;
  remote?: string;
  branch?: string;
  cwd?: string;
  files?: string[];
}

export interface GitPullOptions {
  hard?: boolean;
  remote?: string;
  branch?: string;
  cwd?: string;
}

export interface CommandResult {
  command: string;
  exitCode: number;
  success: boolean;
  stdout?: string;
  stderr?: string;
}

export type DestinationKey = "vault" | "dropbox" | "drive" | "driveLinux" | string;

export interface FileCopyInfo {
  fileName: string;
  filePath: string;
}

export interface SyncStats {
  destinationKey: string;
  destinationPath: string;
  totalFiles: number;
  copiedCount: number;
  skippedCount: number;
  errorCount: number;
  success: boolean;
  error?: string;
}

export interface NewPostOptions {
  fillSkipped?: boolean;
  today?: boolean;
  date?: string;
  interactive?: boolean;
  editTemplate?: boolean;
}

export interface TemplateOptions {
  edit?: boolean;
  preview?: boolean;
  view?: boolean;
  reset?: boolean;
  pathOnly?: boolean;
  editor?: string;
  author?: string;
  heroImage?: string;
  kofiUrl?: string;
  tldrThemePrefix?: string;
  aboutAuthor?: string;
  templateFile?: string;
}
