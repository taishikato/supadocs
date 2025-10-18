"use server";

import { openai } from "@ai-sdk/openai";
import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
// import type { VisibilityType } from "@/components/visibility-selector";
// import {
//   deleteMessagesByChatIdAfterTimestamp,
//   getMessageById,
//   updateChatVisiblityById,
// } from "@/lib/db/queries";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: openai("gpt-4o-mini-2024-07-18"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

// export async function deleteTrailingMessages({ id }: { id: string }) {
//   const [message] = await getMessageById({ id });

//   await deleteMessagesByChatIdAfterTimestamp({
//     chatId: message.chat_id,
//     timestamp: message.created_at,
//   });
// }

// export async function updateChatVisibility({
//   chatId,
//   visibility,
// }: {
//   chatId: string;
//   visibility: "public";
// }) {
//   await updateChatVisiblityById({ chatId, visibility });
// }
