"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@workspace/ui/components/button";

type Role = "user" | "assistant";

type ChatSource = {
  doc_path: string;
  content: string;
  similarity: number;
};

type Message = {
  id: string;
  role: Role;
  content: string;
  sources?: ChatSource[];
  isLoading?: boolean;
};

type ChatPanelProps = {
  initialQuestion?: string;
};

export function ChatPanel({ initialQuestion }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialQuestion
      ? [
          {
            id: generateId(),
            role: "assistant",
            content:
              "Welcome to Supadocs! Feel free to ask anything about the documentation.",
          },
          {
            id: generateId(),
            role: "user",
            content: initialQuestion,
          },
        ]
      : [
          {
            id: generateId(),
            role: "assistant",
            content:
              "Welcome to Supadocs! Ask a question about your project to get started.",
          },
        ]
  );
  const [input, setInput] = useState(initialQuestion ?? "");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || isSending) return;

    const question = input.trim();
    setError(null);
    setInput("");

    const assistantId = generateId();
    const userId = generateId();

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: question },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        isLoading: true,
        sources: [],
      },
    ]);

    setIsSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API Error: ${response.status}`);
      }

      await consumeEventStream(response.body, {
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, sources, isLoading: message.isLoading }
                : message
            )
          );
        },
        onDelta: (delta) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: `${message.content}${delta}`,
                    isLoading: false,
                  }
                : message
            )
          );
        },
        onError: (message) => {
          setError(message);
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId
                ? {
                    ...item,
                    content: message,
                    isLoading: false,
                  }
                : item
            )
          );
        },
        onEnd: () => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, isLoading: false }
                : message
            )
          );
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate a response.";
      setError(message);
      setMessages((prev) =>
        prev.map((item) =>
          item.role === "assistant" && item.isLoading
            ? {
                ...item,
                content: message,
                isLoading: false,
              }
            : item
        )
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid gap-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>

      <form
        id={formId}
        onSubmit={handleSubmit}
        className="sticky bottom-0 flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      >
        <textarea
          name="question"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question about the documentation"
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            The AI will search related documents and craft a grounded response.
          </p>
          <Button type="submit" size="sm" disabled={!canSend}>
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </form>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant";
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-border p-4 ${isAssistant ? "bg-card/50" : "bg-background"}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isAssistant ? "Assistant" : "You"}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {message.content}
      </div>
      {isAssistant && message.sources && message.sources.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Reference documents
          </p>
          <ul className="mt-2 space-y-2 text-xs">
            {message.sources.map((source, index) => (
              <li key={`${source.doc_path}-${index}`} className="leading-snug">
                <span className="font-medium">{source.doc_path}</span>
                <span className="ml-2 text-muted-foreground">
                  Similarity {(source.similarity * 100).toFixed(1)}%
                </span>
                <p className="mt-1 text-muted-foreground">{source.content}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

type StreamCallbacks = {
  onSources: (sources: ChatSource[]) => void;
  onDelta: (delta: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
};

async function consumeEventStream(
  body: ReadableStream<Uint8Array>,
  callbacks: StreamCallbacks
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasEnded = false;

  const processEvent = (chunk: string) => {
    if (!chunk.trim()) return;
    const lines = chunk.split(/\r?\n/);
    let event = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    const dataText = dataLines.join("\n");
    if (!dataText) return;

    try {
      switch (event) {
        case "sources": {
          const sources = JSON.parse(dataText) as ChatSource[];
          callbacks.onSources(sources);
          break;
        }
        case "text": {
          const payload = JSON.parse(dataText) as { delta?: string };
          if (payload.delta) {
            callbacks.onDelta(payload.delta);
          }
          break;
        }
        case "error": {
          const payload = JSON.parse(dataText) as { message?: string };
          callbacks.onError(payload.message ?? "Stream error");
          break;
        }
        case "end": {
          if (!hasEnded) {
            callbacks.onEnd();
            hasEnded = true;
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error("Failed to process SSE event", error);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      processEvent(buffer);
      if (!hasEnded) {
        callbacks.onEnd();
        hasEnded = true;
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      processEvent(chunk);
      boundary = buffer.indexOf("\n\n");
    }
  }
}
