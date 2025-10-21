import { memo, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import type { ChatMessage } from "@/lib/types";
import { Action, Actions } from "./elements/actions";
import { CopyIcon } from "./icons";

export function PureMessageActions({
  message,
  isLoading,
}: {
  message: ChatMessage;
  isLoading: boolean;
}) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const success = await copyToClipboard(textFromParts);
    if (!success) {
      toast.error("Failed to copy to clipboard.");
      return;
    }

    setIsCopied(true);
    toast.success("Copied to clipboard!");
    timeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  if (isLoading) return null;

  return (
    <Actions className="-ml-0.5">
      <Action onClick={handleCopy} tooltip={isCopied ? "Copied" : "Copy"}>
        {isCopied ? <Check size={16} /> : <CopyIcon />}
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(PureMessageActions);
