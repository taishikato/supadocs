"use client";

import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { generateUUID } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

type ChatModalProps = {
  initialChatModel: string;
};

export function ChatModal({ initialChatModel }: ChatModalProps) {
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState(() => generateUUID());

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setChatId(generateUUID());
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Try the Chat</Button>
      </DialogTrigger>
      <DialogOverlay className="backdrop-blur-md" />
      <DialogContent className="flex flex-col bg-transparent border-0 shadow-none focus-visible:outline-none h-dvh">
        <DialogTitle>Supadocs</DialogTitle>
        <DataStreamProvider key={chatId}>
          <Chat
            autoResume={false}
            id={chatId}
            initialChatModel={initialChatModel}
            initialMessages={[]}
            isReadonly={false}
            key={chatId}
          />
          <DataStreamHandler />
        </DataStreamProvider>
      </DialogContent>
    </Dialog>
  );
}
