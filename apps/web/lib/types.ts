import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";

export type DataPart = { type: "append-message"; message: string };

export const citationSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  href: z.string().optional(),
});

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
  citations: z.array(citationSchema).optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;
export type Citation = z.infer<typeof citationSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  getInformation: {
    input: { question: string };
    output: {
      context: string;
      citations: Citation[];
    };
  };
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  clear: null;
  finish: null;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;
