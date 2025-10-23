import type { HTMLAttributes, ReactElement } from "react";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import { CodeBlock } from "@/components/elements/code-block";

type PreElementProps = HTMLAttributes<HTMLPreElement> & {
  children?: ReactElement<
    HTMLAttributes<HTMLElement> & {
      metastring?: string;
    }
  >;
};

const Pre = async ({ children, ...props }: PreElementProps) => {
  if (!children) {
    return <pre {...props} />;
  }

  const code = extractCode(children);
  if (!code) {
    return <pre {...props}>{children}</pre>;
  }

  return (
    <CodeBlock
      code={code.value}
      language={code.language}
      data-code-language={code.language ?? undefined}
    />
  );
};

function extractCode(
  element: ReactElement<
    HTMLAttributes<HTMLElement> & {
      children?: unknown;
    }
  >
): { value: string; language?: string | null } | null {
  if (!element.props) return null;
  const language = inferLanguage(element.props.className);
  const child = element.props.children;

  if (typeof child === "string") {
    return { value: child, language };
  }

  if (Array.isArray(child)) {
    const text = child
      .map((item) => (typeof item === "string" ? item : ""))
      .join("");
    if (text) {
      return { value: text, language };
    }
  }

  return null;
}

function inferLanguage(className?: string): string | null {
  if (!className) return null;

  const match = className.match(/language-([\w-]+)/i);
  return match?.[1] ?? null;
}

type MdxComponents = MDXRemoteProps["components"];

export const mdxComponents: MdxComponents = {
  pre: Pre,
};
