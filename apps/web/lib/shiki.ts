import { cache } from "react";
import {
  getSingletonHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
} from "shiki";

const THEMES: Record<"light" | "dark", BundledTheme> = {
  light: "github-light-default",
  dark: "github-dark-default",
};

const FALLBACK_LANGUAGE = "text" as BundledLanguage;

const REQUESTED_LANGS: BundledLanguage[] = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "diff",
  "dockerfile",
  "graphql",
  "html",
  "ini",
  "javascript",
  "json",
  "markdown",
  "powershell",
  "prisma",
  "python",
  "rust",
  "shellscript",
  "sql",
  "tsx",
  "typescript",
  "yaml",
];

const LANGUAGE_ALIASES: Record<string, BundledLanguage> = {
  cjs: "javascript",
  "c++": "cpp",
  "c#": "csharp",
  cpp: "cpp",
  csharp: "csharp",
  docker: "dockerfile",
  gql: "graphql",
  js: "javascript",
  jsonc: "json",
  jsx: "tsx",
  md: "markdown",
  prisma: "prisma",
  ps1: "powershell",
  py: "python",
  sh: "bash",
  shell: "shellscript",
  ts: "typescript",
  text: FALLBACK_LANGUAGE,
  txt: FALLBACK_LANGUAGE,
  yml: "yaml",
};

const resolveHighlighter = cache(async (): Promise<Highlighter> => {
  return getSingletonHighlighter({
    themes: Object.values(THEMES),
    langs: REQUESTED_LANGS,
  });
});

function normalizeLanguage(input?: string | null): BundledLanguage {
  if (!input) return FALLBACK_LANGUAGE;

  const normalized = input.trim().toLowerCase();
  if (!normalized) return FALLBACK_LANGUAGE;

  const alias = LANGUAGE_ALIASES[normalized];
  if (alias) return alias;

  if (REQUESTED_LANGS.includes(normalized as BundledLanguage)) {
    return normalized as BundledLanguage;
  }

  return FALLBACK_LANGUAGE;
}

export type HighlightResult = {
  lightHtml: string;
  darkHtml: string;
  lightBackground?: string;
  darkBackground?: string;
};

export async function highlightCode(
  code: string,
  options?: { language?: string | null }
): Promise<HighlightResult> {
  const highlighter = await resolveHighlighter();

  const language = normalizeLanguage(options?.language);
  const safeCode = code.replace(/\u00a0/g, " ");

  const lightHtml = highlighter.codeToHtml(safeCode, {
    lang: language,
    theme: THEMES.light,
  });

  const darkHtml = highlighter.codeToHtml(safeCode, {
    lang: language,
    theme: THEMES.dark,
  });

  return {
    lightHtml,
    darkHtml,
    lightBackground: extractBackgroundColor(lightHtml),
    darkBackground: extractBackgroundColor(darkHtml),
  };
}

function extractBackgroundColor(html: string): string | undefined {
  const match = html.match(/background-color:\s*([^;"']+)/i);
  return match?.[1]?.trim();
}
