import {
  approximateTokenCount,
  splitIntoSentences,
  trimMarkdownWhitespace,
} from "./utils";

export interface HeadingInfo {
  level: number;
  title: string;
}

export interface MarkdownChunk {
  index: number;
  content: string;
  headings: HeadingInfo[];
  tokenEstimate: number;
}

export interface ChunkMarkdownOptions {
  maxTokens?: number;
  minTokens?: number;
}

interface SectionHeading {
  type: "heading";
  level: number;
  title: string;
}

interface SectionText {
  type: "text";
  value: string;
}

type MarkdownSection = SectionHeading | SectionText;

const DEFAULT_MAX_TOKENS = 350;
const DEFAULT_MIN_TOKENS = 120;

export function chunkMarkdown(
  markdown: string,
  options: ChunkMarkdownOptions = {},
): MarkdownChunk[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const minTokens = options.minTokens ?? DEFAULT_MIN_TOKENS;
  if (maxTokens <= 0) {
    throw new Error("maxTokens must be greater than zero");
  }

  const sections = parseSections(markdown);
  const chunks: MarkdownChunk[] = [];
  const headings: HeadingInfo[] = [];

  let bufferParts: string[] = [];
  let bufferTokens = 0;
  let chunkIndex = 0;
  let lastHeadingContext: string | undefined;
  let headingTokens = 0;

  const flushChunk = (force = false) => {
    if (bufferParts.length === 0) return;
    if (!force && bufferTokens < minTokens && chunkIndex > 0) {
      return;
    }

    const content = trimMarkdownWhitespace(bufferParts.join("\n\n"));
    chunks.push({
      index: chunkIndex++,
      content,
      headings: headings.slice(),
      tokenEstimate: bufferTokens,
    });

    bufferParts = [];
    bufferTokens = 0;
    lastHeadingContext = undefined;
    headingTokens = 0;
  };

  const ensureHeadingContext = () => {
    const headingContext = formatHeadingContext(headings);
    if (!headingContext || headingContext === lastHeadingContext) return;

    const estimated = approximateTokenCount(headingContext);
    bufferParts.push(headingContext);
    bufferTokens += estimated;
    lastHeadingContext = headingContext;
    headingTokens = estimated;
  };

  for (const section of sections) {
    if (section.type === "heading") {
      flushChunk(true);
      updateHeadings(headings, section);
      continue;
    }

    const segments = splitSection(section.value, maxTokens, headingTokens);
    for (const segment of segments) {
      const trimmed = trimMarkdownWhitespace(segment);
      if (!trimmed) continue;

      const segmentTokens = approximateTokenCount(trimmed);
      const totalTokens = bufferTokens + segmentTokens;

      if (bufferTokens === 0) {
        ensureHeadingContext();
      }

      if (bufferTokens > 0 && totalTokens > maxTokens) {
        flushChunk(true);
        ensureHeadingContext();
      }

      bufferParts.push(trimmed);
      bufferTokens += segmentTokens;
    }
  }

  flushChunk(true);
  return chunks;
}

function parseSections(markdown: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const lines = markdown.split("\n");
  const textBuffer: string[] = [];

  const pushBufferedText = () => {
    const combined = trimMarkdownWhitespace(textBuffer.join("\n"));
    if (combined) {
      sections.push({ type: "text", value: combined });
    }
    textBuffer.length = 0;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      pushBufferedText();
      sections.push({
        type: "heading",
        level: headingMatch[1]!.length,
        title: headingMatch[2]!.trim(),
      });
      continue;
    }

    if (line.trim().length === 0) {
      pushBufferedText();
    } else {
      textBuffer.push(line);
    }
  }

  pushBufferedText();
  return sections;
}

function updateHeadings(
  headings: HeadingInfo[],
  section: SectionHeading,
): void {
  while (
    headings.length > 0 && headings[headings.length - 1]!.level >= section.level
  ) {
    headings.pop();
  }
  headings.push({ level: section.level, title: section.title });
}

function formatHeadingContext(headings: HeadingInfo[]): string | undefined {
  if (headings.length === 0) return undefined;
  return headings
    .map((heading) => `${"#".repeat(heading.level)} ${heading.title}`)
    .join("\n");
}

function splitSection(
  text: string,
  maxTokens: number,
  headingTokens: number,
): string[] {
  if (approximateTokenCount(text) + headingTokens <= maxTokens) {
    return [text];
  }

  const sentences = splitIntoSentences(text);
  if (sentences.length <= 1) {
    return fallbackSplit(text, maxTokens - headingTokens);
  }

  const segments: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!sentence) continue;
    const candidate = current ? `${current} ${sentence}`.trim() : sentence;
    const tokens = approximateTokenCount(candidate) + headingTokens;

    if (tokens > maxTokens) {
      if (current) {
        segments.push(current);
        current = sentence;
      } else {
        segments.push(...fallbackSplit(sentence, maxTokens - headingTokens));
        current = "";
      }
    } else {
      current = candidate;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

function fallbackSplit(text: string, maxTokens: number): string[] {
  if (maxTokens <= 0) {
    return [text];
  }

  const approxTokens = approximateTokenCount(text);
  if (approxTokens <= maxTokens) {
    return [text];
  }

  const charsPerSegment = Math.max(50, Math.floor(maxTokens * 4));
  const result: string[] = [];

  for (let index = 0; index < text.length; index += charsPerSegment) {
    result.push(text.slice(index, index + charsPerSegment));
  }

  return result;
}
