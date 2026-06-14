/**
 * In-app messaging service (Feature A.8).
 * Tenant-scoped (all conversations carry tenantId). Real-time delivery uses the
 * SSE pattern (A.7); attachments use a field that A.9 file storage will fill.
 */
import { db } from "@/lib/db";
import { createInApp } from "@/lib/services/notification.service";

export class MessagingError extends Error {
  constructor(
    public code: "NOT_PARTICIPANT" | "NOT_FOUND" | "ANNOUNCEMENT_LOCKED",
    message: string
  ) {
    super(message);
    this.name = "MessagingError";
  }
}

/** Assert a user participates in a conversation; returns the participant row. */
async function requireParticipant(conversationId: string, userId: string) {
  const p = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!p) throw new MessagingError("NOT_PARTICIPANT", "You're not in this conversation.");
  return p;
}

/**
 * Create a conversation. For DIRECT (1:1) we reuse an existing thread between
 * the same two people instead of creating duplicates.
 */
export async function createConversation(
  tenantId: string,
  creator: { id: string; fullName: string },
  input: {
    type: "DIRECT" | "GROUP" | "ANNOUNCEMENT";
    title?: string;
    participantIds: string[];
  }
) {
  const memberIds = Array.from(new Set([creator.id, ...input.participantIds]));

  if (input.type === "DIRECT" && memberIds.length === 2) {
    // Find an existing 1:1 between exactly these two.
    const existing = await db.conversation.findFirst({
      where: {
        tenantId,
        type: "DIRECT",
        participants: { every: { userId: { in: memberIds } } },
      },
      include: { participants: true },
    });
    if (existing && existing.participants.length === 2) return existing;
  }

  return db.conversation.create({
    data: {
      tenantId,
      type: input.type,
      title: input.title,
      createdById: creator.id,
      participants: {
        create: memberIds.map((uid) => ({
          userId: uid,
          role:
            input.type === "ANNOUNCEMENT" && uid === creator.id
              ? "admin"
              : "member",
          // Sender starts "caught up"; others have it unread.
          lastReadAt: uid === creator.id ? new Date() : null,
        })),
      },
    },
    include: { participants: true },
  });
}

/** Send a message. Enforces participation + announcement reply-lock. */
export async function sendMessage(
  tenantId: string,
  sender: { id: string; fullName: string },
  input: { conversationId: string; body: string; attachmentUrl?: string; attachmentName?: string }
) {
  const convo = await db.conversation.findFirst({
    where: { id: input.conversationId, tenantId },
    include: { participants: true },
  });
  if (!convo) throw new MessagingError("NOT_FOUND", "Conversation not found.");

  const me = await requireParticipant(convo.id, sender.id);

  // Announcements: only the admin (sender) may post; others can't reply.
  if (convo.type === "ANNOUNCEMENT" && me.role !== "admin") {
    throw new MessagingError(
      "ANNOUNCEMENT_LOCKED",
      "Announcements don't accept replies."
    );
  }

  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId: convo.id,
        tenantId,
        senderId: sender.id,
        senderName: sender.fullName,
        body: input.body,
        attachmentUrl: input.attachmentUrl,
        attachmentName: input.attachmentName,
      },
    }),
    db.conversation.update({
      where: { id: convo.id },
      data: { updatedAt: new Date() },
    }),
    // Sender is caught up on their own message.
    db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: convo.id, userId: sender.id } },
      data: { lastReadAt: new Date() },
    }),
  ]);

  // Fire an in-app notification to every other participant.
  const others = convo.participants.filter((p) => p.userId !== sender.id);
  for (const p of others) {
    await createInApp({
      tenantId,
      recipientId: p.userId,
      title:
        convo.type === "DIRECT"
          ? `Message from ${sender.fullName}`
          : `${convo.title ?? "Group"}: ${sender.fullName}`,
      body: input.body.slice(0, 120),
      category: "message",
      href: `/messages?c=${convo.id}`,
    });
  }

  return message;
}

/** List a user's conversations with last message + unread count. */
export async function listConversations(tenantId: string, userId: string) {
  const convos = await db.conversation.findMany({
    where: { tenantId, participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return Promise.all(
    convos.map(async (c) => {
      const me = c.participants.find((p) => p.userId === userId);
      const unread = await db.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          createdAt: me?.lastReadAt ? { gt: me.lastReadAt } : undefined,
        },
      });
      // Resolve a display title for 1:1 (the other person's name).
      let title = c.title;
      if (c.type === "DIRECT") {
        const otherId = c.participants.find((p) => p.userId !== userId)?.userId;
        if (otherId) {
          const other = await db.user.findUnique({
            where: { id: otherId },
            select: { fullName: true },
          });
          title = other?.fullName ?? "Conversation";
        }
      }
      return {
        id: c.id,
        type: c.type,
        title: title ?? "Conversation",
        lastMessage: c.messages[0]?.body ?? null,
        lastAt: c.messages[0]?.createdAt ?? c.createdAt,
        unread,
      };
    })
  );
}

/** Fetch messages for a conversation (participant-checked) + mark read. */
export async function getMessages(
  tenantId: string,
  userId: string,
  conversationId: string,
  opts?: { markRead?: boolean }
) {
  const convo = await db.conversation.findFirst({
    where: { id: conversationId, tenantId },
  });
  if (!convo) throw new MessagingError("NOT_FOUND", "Conversation not found.");
  await requireParticipant(conversationId, userId);

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  if (opts?.markRead) {
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  // Read receipts: who has read up to the latest message.
  const participants = await db.conversationParticipant.findMany({
    where: { conversationId },
  });

  return {
    conversation: { id: convo.id, type: convo.type, title: convo.title },
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      createdAt: m.createdAt,
      mine: m.senderId === userId,
    })),
    receipts: participants.map((p) => ({
      userId: p.userId,
      lastReadAt: p.lastReadAt,
    })),
  };
}

/** Total unread messages across all of a user's conversations. */
export async function totalUnread(tenantId: string, userId: string) {
  const convos = await listConversations(tenantId, userId);
  return convos.reduce((s, c) => s + c.unread, 0);
}

/** Search within a conversation (participant-checked). */
export async function searchMessages(
  tenantId: string,
  userId: string,
  conversationId: string,
  q: string
) {
  const convo = await db.conversation.findFirst({
    where: { id: conversationId, tenantId },
  });
  if (!convo) throw new MessagingError("NOT_FOUND", "Conversation not found.");
  await requireParticipant(conversationId, userId);

  const results = await db.message.findMany({
    where: { conversationId, body: { contains: q } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return results.map((m) => ({
    id: m.id,
    senderName: m.senderName,
    body: m.body,
    createdAt: m.createdAt,
  }));
}
