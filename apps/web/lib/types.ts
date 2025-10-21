import type { UIMessage } from "ai";
import { z } from "zod";

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

export type ChatTools = {
  getInformation: {
    input: { question: string };
    output: {
      context: string;
    };
  };
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
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
