import { getDocBySlug } from "@/lib/docs";

export const dynamic = "force-static";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const resolvedParams = await params;
  const slugParam = resolvedParams?.slug;
  const slug = Array.isArray(slugParam)
    ? slugParam
    : typeof slugParam === "string"
    ? [slugParam]
    : [];
  if (slug.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid slug" }), {
      status: 400,
      statusText: "Bad Request",
      headers: { "Content-Type": "application/json" },
    });
  }

  const doc = await getDocBySlug(slug);
  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  const frontmatterEntries = Object.entries(doc.frontmatter ?? {});
  const frontmatterBlock = frontmatterEntries.length > 0
    ? `---\n${
      frontmatterEntries
        .map(([key, value]) => `${key}: ${formatFrontmatterValue(value)}`)
        .join("\n")
    }\n---\n\n`
    : "";

  const body = `${frontmatterBlock}${doc.content.replace(/^\s+/, "")}`;

  const fileSlug = slug[slug.length - 1] ?? "document";
  const fileName = `${fileSlug}.md`;
  const encoded = encodeRFC5987ValueChars(fileName);

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${
        sanitizeFileName(fileName)
      }"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "public, max-age=60",
    },
  });
}

function formatFrontmatterValue(value: string): string {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9 _-]+$/.test(trimmed)) {
    return trimmed;
  }
  return JSON.stringify(trimmed);
}

function sanitizeFileName(name: string): string {
  return name.replace(/["\r\n]/g, "").slice(0, 150);
}

function encodeRFC5987ValueChars(str: string): string {
  return encodeURIComponent(str)
    .replace(/['()]/g, escape)
    .replace(/\*/g, "%2A")
    .replace(/%(7C|60|5E)/g, "%$1");
}
