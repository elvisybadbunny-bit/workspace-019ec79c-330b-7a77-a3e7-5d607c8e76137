import { z } from "zod";

/** Create a conversation (A.8). */
export const createConversationSchema = z.object({
  type: z.enum(["DIRECT", "GROUP", "ANNOUNCEMENT"]).default("DIRECT"),
  title: z.string().trim().max(120).optional(),
  participantIds: z.array(z.string()).min(1, "Pick at least one person"),
});

/** Send a message (A.8). Attachment fields land with A.9 file storage. */
export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, "Type a message").max(4000),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().max(200).optional(),
});

export const searchMessagesSchema = z.object({
  conversationId: z.string().min(1),
  q: z.string().trim().min(1).max(100),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
