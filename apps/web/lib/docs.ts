import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type DocEntry = {
  slug: string[];
  title: string;
  description?: string;
  content: string;
  frontmatter: Record<string, string>;
};

const DOCS_DIR = resolveDocsDir();

export async function listDocSlugs(): Promise<string[][]> {
  const files = await collectFiles(DOCS_DIR);
  return files.map((file) => {
    const relative = path.relative(DOCS_DIR, file);
    const withoutExt = relative.replace(/\.(md|mdx)$/, "");
    return withoutExt.split(path.sep);
  });
}

export async function getDocBySlug(slug: string[]): Promise<DocEntry | null> {
  const filePath = path.join(DOCS_DIR, `${slug.join("/")}.mdx`);

  try {
    const raw = await readFile(filePath, "utf8");
    const frontmatterMatch = raw.match(/^---\n([\s\S]+?)\n---\n?/);
    let title = slug[slug.length - 1] ?? "Untitled";
    let description: string | undefined;
    let content = raw;
    let frontmatter: Record<string, string> = {};

    if (frontmatterMatch) {
      frontmatter = parseFrontmatter(frontmatterMatch[1]!);
      title = frontmatter.title ?? title;
      description = frontmatter.description;
      content = raw.slice(frontmatterMatch[0]!.length);
    }

    return { slug, title, description, content, frontmatter };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function collectFiles(dir: string): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(res);
      }
      if (/\.(md|mdx)$/.test(entry.name)) {
        return [res];
      }
      return [];
    }),
  );
  return files.flat();
}

function parseFrontmatter(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = source.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/);
    if (!match) continue;
    const key = match[1];
    if (!key) continue;
    const rawValue = match[2] ?? "";
    result[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return result;
}

function resolveDocsDir(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "content/docs"),
    path.join(cwd, "apps/web/content/docs"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Docs directory not found. Checked: ${candidates.join(", ")}`,
  );
}
