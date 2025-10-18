import equal from "fast-deep-equal";
import { memo } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
// import type { Vote } from "@/lib/db/schema";
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

  if (isLoading) {
    return null;
  }

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

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  };

  return (
    <Actions className="-ml-0.5">
      <Action onClick={handleCopy} tooltip="Copy">
        <CopyIcon />
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(PureMessageActions);
