import fs from 'fs/promises';
import path from 'path';

const DEFAULT_INCLUDE_DIRS = ['src', 'app', 'api'];
const MAX_FILE_COUNT = 120;
const MAX_FILE_PREVIEW_CHARS = 1200;

export interface CodeSummaryOptions {
  projectPath: string;
  includePaths?: string[];
}

export async function buildCodeSummary(
  options: CodeSummaryOptions
): Promise<string> {
  const include = options.includePaths?.length
    ? options.includePaths
    : DEFAULT_INCLUDE_DIRS;
  const parts: string[] = [];
  let fileCounter = 0;

  for (const rel of include) {
    const abs = path.resolve(options.projectPath, rel);
    const exists = await existsDir(abs);
    if (!exists) continue;
    const tree = await collectTree(abs, {
      maxDepth: 2,
      currentDepth: 0,
    });
    if (tree) {
      parts.push(`目录 ${rel}:\n${tree}`);
    }
    const previews = await collectFilePreviews(abs, {
      root: abs,
      limit: MAX_FILE_COUNT - fileCounter,
    });
    fileCounter += previews.count;
    if (previews.snippets.length > 0) {
      parts.push(previews.snippets.join('\n\n'));
    }
    if (fileCounter >= MAX_FILE_COUNT) break;
  }

  if (parts.length === 0) {
    return '（未能扫描到有效代码目录，请检查命令参数）';
  }
  return parts.join('\n\n');
}

async function existsDir(target: string): Promise<boolean> {
  try {
    const stat = await fs.stat(target);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

interface CollectTreeOptions {
  maxDepth: number;
  currentDepth: number;
}

async function collectTree(
  dir: string,
  options: CollectTreeOptions
): Promise<string | undefined> {
  if (options.currentDepth > options.maxDepth) {
    return undefined;
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const lines: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      lines.push(`${'  '.repeat(options.currentDepth)}- ${entry.name}/`);
      const child = await collectTree(path.join(dir, entry.name), {
        maxDepth: options.maxDepth,
        currentDepth: options.currentDepth + 1,
      });
      if (child) {
        lines.push(child);
      }
    } else if (options.currentDepth < options.maxDepth) {
      lines.push(`${'  '.repeat(options.currentDepth)}- ${entry.name}`);
    }
  }

  if (lines.length === 0) return undefined;
  return lines.join('\n');
}

interface CollectPreviewOptions {
  root: string;
  limit: number;
}

async function collectFilePreviews(
  dir: string,
  options: CollectPreviewOptions
): Promise<{ count: number; snippets: string[] }> {
  if (options.limit <= 0) return { count: 0, snippets: [] };
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  let count = 0;
  const snippets: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const child = await collectFilePreviews(abs, {
        root: options.root,
        limit: options.limit - count,
      });
      count += child.count;
      snippets.push(...child.snippets);
    } else {
      if (!isInterestingFile(entry.name)) continue;
      const content = await safeReadFile(abs, MAX_FILE_PREVIEW_CHARS);
      snippets.push(
        `文件 ${path.relative(options.root, abs)} 摘要:\n${content}`
      );
      count += 1;
      if (count >= options.limit) break;
    }
  }

  return { count, snippets };
}

function isInterestingFile(name: string): boolean {
  return /\.(ts|tsx|js|jsx|py|go|java|kt|cs|php|rb|rs|sql|proto)$/i.test(name);
}

async function safeReadFile(
  filePath: string,
  maxChars: number
): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    if (content.length <= maxChars) return content;
    return content.slice(0, maxChars) + '\n...';
  } catch {
    return '(读取失败)';
  }
}
