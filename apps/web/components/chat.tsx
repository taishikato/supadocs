"use client";

import { useChat } from "@ai-sdk/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatSDKError } from "@/lib/errors";
import {
  CustomUIDataTypes,
  messageMetadataSchema,
  type ChatMessage,
} from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { toast } from "./toast";
import { DataUIPart } from "ai";

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: ChatMessage[];
  isReadonly: boolean;
}) {
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");

  const { messages, setMessages, sendMessage, status, stop } =
    useChat<ChatMessage>({
      id,
      messages: initialMessages,
      experimental_throttle: 100,
      messageMetadataSchema,
      generateId: generateUUID,
      // @ts-expect-error DataUIPart is not fully typed for custom UI data yet
      onData: (dataPart: DataUIPart<CustomUIDataTypes>) => {
        setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      },
      onError: (error) => {
        if (error instanceof ChatSDKError) {
          toast({
            type: "error",
            description: error.message,
          });
        }
      },
    });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  return (
    <div className="overscroll-behavior-contain flex h-full min-h-0 min-w-0 touch-pan-y flex-col">
      <Messages isReadonly={isReadonly} messages={messages} status={status} />

      <div className="z-1 mx-auto mt-auto flex w-full max-w-4xl gap-2 border-t-0 px-2 pb-3 md:px-4 md:pb-4">
        {!isReadonly && (
          <MultimodalInput
            input={input}
            sendMessage={sendMessage}
            setInput={setInput}
            setMessages={setMessages}
            status={status}
            stop={stop}
          />
        )}
      </div>
    </div>
  );
}
