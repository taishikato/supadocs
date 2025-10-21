"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@workspace/ui/components/button";

export function CopyDocButton({ slug }: { slug: string[] }) {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">(
    "idle"
  );

  useEffect(() => {
    if (status !== "copied") return;

    const timer = setTimeout(() => {
      setStatus("idle");
    }, 2000);

    return () => clearTimeout(timer);
  }, [status]);

  const handleCopy = useCallback(async () => {
    if (status === "copying") return;

    setStatus("copying");

    try {
      const encodedSlug = slug
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      const response = await fetch(`/api/docs/download/${encodedSlug}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }

      const markdown = await response.text();

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API not available");
      }

      await navigator.clipboard.writeText(markdown);
      setStatus("copied");
    } catch (error) {
      console.error("Failed to copy page markdown", error);
      setStatus("error");
    } finally {
      setStatus((prev) => (prev === "copying" ? "idle" : prev));
    }
  }, [slug, status]);

  const label =
    status === "copied"
      ? "Copied to clipboard"
      : status === "copying"
        ? "Copying..."
        : status === "error"
          ? "Copy failed"
          : "Copy page";

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      disabled={status === "copying"}
    >
      {label}
    </Button>
  );
}
