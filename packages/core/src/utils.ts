export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function approximateTokenCount(text: string): number {
  if (!text) return 0;
  const cleaned = text.trim();
  if (!cleaned) return 0;
  const charEstimate = cleaned.length / 4;
  const wordEstimate = cleaned.split(/\s+/).length;
  return Math.max(1, Math.round((charEstimate + wordEstimate) / 2));
}

export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  const matches = text.match(
    /[^。．\.!?！？]+(?:[。．\.!?！？]+|\n+|$)/g,
  );
  if (!matches) return [text.trim()];
  return matches
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function trimMarkdownWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}
