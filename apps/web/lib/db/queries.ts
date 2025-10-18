import "server-only";

// import type { ArtifactKind } from "@/components/artifact";
// import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import { getServiceSupabaseClient } from "../supabase";
import type { AppUsage } from "../usage";
// import { generateUUID } from "../utils";
import type { Chat, DBMessage, Document, Suggestion } from "./schema";
// import { generateHashedPassword } from "./utils";

const supabaseClient = getServiceSupabaseClient();

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(value as string);
}

function toIsoString(value: unknown): string {
  return toDate(value).toISOString();
}

function parseChat(row: Record<string, any>): Chat {
  return {
    ...row,
    created_at: toDate(row.created_at),
  } as Chat;
}

function parseMessage(row: Record<string, any>): DBMessage {
  const createdAtValue = row.created_at ?? row.createdAt ?? new Date();

  return {
    id: row.id,
    chat_id: row.chat_id ?? row.chatId,
    role: row.role,
    parts: row.parts ?? [],
    attachments: row.attachments ?? [],
    created_at: toDate(createdAtValue),
  } as DBMessage;
}

function parseDocument(row: Record<string, any>): Document {
  return {
    ...row,
    createdAt: toDate(row.createdAt),
  } as Document;
}

function parseSuggestion(row: Record<string, any>): Suggestion {
  return {
    ...row,
    createdAt: toDate(row.createdAt),
    documentCreatedAt: toDate(row.documentcreatedAt),
  } as Suggestion;
}

export async function getUser(email: string) {
  const { data, error } = await supabaseClient
    .from("user")
    .select("*")
    .eq("email", email);

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return data ?? [];
}

// export async function createUser(email: string, password: string) {
//   const hashedPassword = generateHashedPassword(password);
//   const { data, error } = await supabaseClient
//     .from("user")
//     .insert({ email, password: hashedPassword })
//     .select();

//   if (error) {
//     throw new ChatSDKError("bad_request:database", error.message);
//   }

//   return data ?? [];
// }

// export async function createGuestUser() {
//   const email = `guest-${Date.now()}`;
//   const password = generateHashedPassword(generateUUID());

//   const { data, error } = await supabaseClient
//     .from("user")
//     .insert({ email, password })
//     .select();

//   if (error) {
//     throw new ChatSDKError("bad_request:database", error.message);
//   }

//   return data ?? [];
// }

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: "private" | "public";
}) {
  const { data, error } = await supabaseClient
    .from("chat")
    .insert({
      id,
      created_at: new Date().toISOString(),
      user_id: userId,
      title,
      visibility,
    })
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseChat);
}

export async function deleteChatById({ id }: { id: string }) {
  const { error: voteError } = await supabaseClient
    .from("vote")
    .delete()
    .eq("chat_id", id);

  if (voteError) {
    throw new ChatSDKError("bad_request:database", voteError.message);
  }

  const { error: messageError } = await supabaseClient
    .from("message")
    .delete()
    .eq("chat_id", id);

  if (messageError) {
    throw new ChatSDKError("bad_request:database", messageError.message);
  }

  const { error: streamError } = await supabaseClient
    .from("stream")
    .delete()
    .eq("chat_id", id);

  if (streamError) {
    throw new ChatSDKError("bad_request:database", streamError.message);
  }

  const { data, error } = await supabaseClient
    .from("chat")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseChat);
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  const extendedLimit = limit + 1;

  let query = supabaseClient
    .from("chat")
    .select("*")
    .match({ user_id: id })
    .order("created_at", { ascending: false })
    .limit(extendedLimit);

  if (startingAfter) {
    const { data: pivotChat, error: pivotError } = await supabaseClient
      .from("chat")
      .select("created_at")
      .eq("id", startingAfter)
      .maybeSingle();

    if (pivotError) {
      throw new ChatSDKError("bad_request:database", pivotError.message);
    }

    if (!pivotChat || !pivotChat.created_at) {
      throw new ChatSDKError(
        "not_found:database",
        `Chat with id ${startingAfter} not found`,
      );
    }

    query = query.gt("created_at", toIsoString(pivotChat.created_at));
  } else if (endingBefore) {
    const { data: pivotChat, error: pivotError } = await supabaseClient
      .from("chat")
      .select("created_at")
      .eq("id", endingBefore)
      .maybeSingle();

    if (pivotError) {
      throw new ChatSDKError("bad_request:database", pivotError.message);
    }

    if (!pivotChat || !pivotChat.created_at) {
      throw new ChatSDKError(
        "not_found:database",
        `Chat with id ${endingBefore} not found`,
      );
    }

    query = query.lt("created_at", toIsoString(pivotChat.created_at));
  }

  const { data, error } = await query;

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  const chats = (data ?? []).map(parseChat);
  const hasMore = chats.length > limit;

  return {
    chats: hasMore ? chats.slice(0, limit) : chats,
    hasMore,
  };
}

export async function getChatById({ id }: { id: string }) {
  const { data, error } = await supabaseClient
    .from("chat")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return data ? parseChat(data as Record<string, any>) : null;
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  const { data, error } = await supabaseClient
    .from("message")
    .insert(
      messages.map((message) => ({
        id: message.id,
        chat_id: message.chat_id,
        role: message.role,
        parts: message.parts ?? [],
        attachments: message.attachments ?? [],
        created_at: message.created_at instanceof Date
          ? message.created_at.toISOString()
          : (message.created_at ?? new Date().toISOString()),
      })),
    )
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseMessage);
}

export async function getMessagesByChatId({ id }: { id: string }) {
  const { data, error } = await supabaseClient
    .from("message")
    .select("*")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseMessage);
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  const { data: existingVote, error: existingVoteError } = await supabaseClient
    .from("vote")
    .select("*")
    .eq("chat_id", chatId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (existingVoteError) {
    throw new ChatSDKError("bad_request:database", existingVoteError.message);
  }

  if (existingVote) {
    const { data: updatedVote, error: updateVoteError } = await supabaseClient
      .from("vote")
      .update({ isUpvoted: type === "up" })
      .eq("chat_id", chatId)
      .eq("message_id", messageId)
      .select();

    if (updateVoteError) {
      throw new ChatSDKError("bad_request:database", updateVoteError.message);
    }

    return updatedVote ?? [];
  }

  const { data, error } = await supabaseClient
    .from("vote")
    .insert({
      chat_id: chatId,
      message_id: messageId,
      isUpvoted: type === "up",
    })
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return data ?? [];
}

export async function getVotesByChatId({ id }: { id: string }) {
  const { data, error } = await supabaseClient
    .from("vote")
    .select("*")
    .eq("chat_id", id);

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return data ?? [];
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: "code" | "text" | "image" | "sheet";
  content: string;
  userId: string;
}) {
  const { data, error } = await supabaseClient
    .from("document")
    .insert({
      id,
      title,
      kind,
      content,
      userId,
      created_at: new Date().toISOString(),
    })
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseDocument);
}

export async function getDocumentsById({ id }: { id: string }) {
  const { data, error } = await supabaseClient
    .from("document")
    .select("*")
    .eq("id", id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseDocument);
}

export async function getDocumentById({ id }: { id: string }) {
  const { data, error } = await supabaseClient
    .from("document")
    .select("*")
    .eq("id", id)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return data ? parseDocument(data as Record<string, any>) : null;
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const timestampIso = timestamp.toISOString();

  const { error: deleteSuggestionsError } = await supabaseClient
    .from("suggestion")
    .delete()
    .eq("documentId", id)
    .gt("documentcreated_at", timestampIso);

  if (deleteSuggestionsError) {
    throw new ChatSDKError(
      "bad_request:database",
      deleteSuggestionsError.message,
    );
  }

  const { data, error } = await supabaseClient
    .from("document")
    .delete()
    .eq("id", id)
    .gt("created_at", timestampIso)
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseDocument);
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  const { data, error } = await supabaseClient
    .from("suggestion")
    .insert(suggestions)
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseSuggestion);
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  const { data, error } = await supabaseClient
    .from("suggestion")
    .select("*")
    .eq("documentId", documentId);

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseSuggestion);
}

export async function getMessageById({ id }: { id: string }) {
  const { data, error } = await supabaseClient
    .from("message")
    .select("*")
    .eq("id", id);

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseMessage);
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const timestampIso = timestamp.toISOString();

  const { data: messagesToDelete, error: selectError } = await supabaseClient
    .from("message")
    .select("id")
    .eq("chat_id", chatId)
    .gte("created_at", timestampIso);

  if (selectError) {
    throw new ChatSDKError("bad_request:database", selectError.message);
  }

  const messageIds = (messagesToDelete ?? []).map(
    (currentMessage) => currentMessage.id,
  );

  if (messageIds.length === 0) {
    return [];
  }

  const { error: deleteVotesError } = await supabaseClient
    .from("vote")
    .delete()
    .eq("chat_id", chatId)
    .in("message_id", messageIds);

  if (deleteVotesError) {
    throw new ChatSDKError("bad_request:database", deleteVotesError.message);
  }

  const { data, error } = await supabaseClient
    .from("message")
    .delete()
    .eq("chat_id", chatId)
    .in("id", messageIds)
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseMessage);
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  const { data, error } = await supabaseClient
    .from("chat")
    .update({ visibility })
    .eq("id", chatId)
    .select();

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(parseChat);
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  const { error } = await supabaseClient
    .from("chat")
    .update({ lastContext: context })
    .eq("id", chatId);

  if (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  const twentyFourHoursAgo = new Date(
    Date.now() - differenceInHours * 60 * 60 * 1000,
  );

  const { count, error } = await supabaseClient
    .from("message")
    .select("id, chat!inner(user_id)", { count: "exact", head: true })
    .eq("chat.user_id", id)
    .eq("role", "user")
    .gte("created_at", twentyFourHoursAgo.toISOString());

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return count ?? 0;
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  const { error } = await supabaseClient.from("stream").insert({
    id: streamId,
    chat_id: chatId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  const { data, error } = await supabaseClient
    .from("stream")
    .select("id")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ChatSDKError("bad_request:database", error.message);
  }

  return (data ?? []).map(({ id: streamId }) => streamId);
}
