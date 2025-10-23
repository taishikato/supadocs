import type { HTMLAttributes, ReactNode } from "react";
import { highlightCode } from "@/lib/shiki";
import { cn } from "@/lib/utils";
import { CodeBlockCopyButton } from "./code-block-copy-button";

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language?: string | null;
  showCopyButton?: boolean;
  children?: ReactNode;
};

export async function CodeBlock({
  code,
  language,
  showCopyButton = true,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const copySource = normalizeLineEndings(code);
  const highlightedSource = trimTrailingNewline(copySource);
  const { lightHtml, darkHtml, lightBackground, darkBackground } =
    await highlightCode(highlightedSource, {
      language,
    });

  return (
    <div
      className={cn(
        "not-prose relative w-full overflow-hidden rounded-lg border bg-background text-foreground",
        className
      )}
      {...props}
    >
      <div className="relative">
        <ShikiMarkup
          backgroundColor={lightBackground}
          className="overflow-hidden dark:hidden"
          html={lightHtml}
        />
        <ShikiMarkup
          backgroundColor={darkBackground}
          className="hidden overflow-hidden dark:block"
          html={darkHtml}
        />
        {(showCopyButton || children) && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {showCopyButton ? <CodeBlockCopyButton code={copySource} /> : null}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

type ShikiMarkupProps = {
  html: string;
  className?: string;
  backgroundColor?: string;
};

function ShikiMarkup({ html, className, backgroundColor }: ShikiMarkupProps) {
  const style = backgroundColor
    ? { backgroundColor, borderRadius: "inherit" as const }
    : undefined;

  return (
    <div
      className={cn("overflow-x-auto px-5 py-4 text-sm", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function normalizeLineEndings(input: string): string {
  return input.replace(/\r\n/g, "\n");
}

function trimTrailingNewline(input: string): string {
  if (!input.endsWith("\n")) {
    return input;
  }

  let result = input;
  while (result.endsWith("\n")) {
    result = result.slice(0, -1);
  }
  return result;
}

export { CodeBlockCopyButton } from "./code-block-copy-button";
