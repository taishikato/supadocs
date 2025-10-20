"use client";

import equal from "fast-deep-equal";
import { motion } from "framer-motion";
import { memo, useMemo, useState } from "react";
import type { ChatMessage, Citation } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";

const PurePreviewMessage = ({
  message,
  isLoading,
  isReadonly,
  requiresScrollPadding,
}: {
  message: ChatMessage;
  isLoading: boolean;
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  useDataStream();

  const citations = useMemo(() => {
    if (message.role !== "assistant") {
      return [] as Citation[];
    }

    const raw = message.metadata?.citations;
    if (!Array.isArray(raw)) {
      return [] as Citation[];
    }

    return raw
      .map((citation) => {
        if (!citation?.id) return null;

        const href = citation.href?.trim();
        const isSafeHref =
          typeof href === "string" &&
          (href.startsWith("http://") ||
            href.startsWith("https://") ||
            href.startsWith("/"));

        return {
          id: citation.id,
          title: citation.title?.trim() ?? undefined,
          href: isSafeHref ? href : undefined,
        } satisfies Citation;
      })
      .filter(Boolean) as Citation[];
  }, [message.metadata?.citations, message.role]);

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="group/message w-full"
      data-role={message.role}
      data-testid={`message-${message.role}`}
      initial={{ opacity: 0 }}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            ),
            "min-h-96": message.role === "assistant" && requiresScrollPadding,
            "w-full":
              (message.role === "assistant" &&
                message.parts?.some(
                  (p) => p.type === "text" && p.text?.trim()
                )) ||
              mode === "edit",
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

            if (type === "text") {
              if (mode === "view") {
                return (
                  <div key={key}>
                    <MessageContent
                      className={cn({
                        "w-fit break-words rounded-2xl px-3 py-2 text-right text-white":
                          message.role === "user",
                        "bg-transparent px-0 py-0 text-left":
                          message.role === "assistant",
                      })}
                      data-testid="message-content"
                      style={
                        message.role === "user"
                          ? { backgroundColor: "#006cff" }
                          : undefined
                      }
                    >
                      <Response>{sanitizeText(part.text)}</Response>
                    </MessageContent>
                  </div>
                );
              }
            }

            if (type === "tool-getInformation") {
              return (
                <div key={key}>
                  call{part.state === "output-available" ? "ed" : "ing"} tool:{" "}
                  {part.type}
                </div>
              );
            }

            return null;
          })}

          {message.role === "assistant" && citations.length > 0 ? (
            <div className="mt-3 text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">Sources</div>
              <ul className="mt-2 space-y-1">
                {citations.map((citation) => {
                  const label = sanitizeText(
                    citation.title ?? citation.href ?? citation.id
                  );

                  return (
                    <li className="flex gap-2" key={citation.id}>
                      <span className="font-mono text-xs text-muted-foreground">
                        [{citation.id}]
                      </span>
                      {citation.href ? (
                        <a
                          className="truncate text-foreground underline"
                          href={citation.href}
                          rel="noreferrer noopener"
                          target="_blank"
                        >
                          {label}
                        </a>
                      ) : (
                        <span className="truncate">{label}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {!isReadonly && (
            <MessageActions
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.message.id !== nextProps.message.id) {
      return false;
    }
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }

    return false;
  }
);
