"use server";

import { db } from "@/db";
import { checkpointsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

export async function getChats(threadId: string): Promise<ChatMessage[]> {
  try {
    const checkpoints = await db
      .select({
        id: checkpointsTable.id,
        checkpoint: checkpointsTable.checkpoint,
        metadata: checkpointsTable.metadata,
        createdAt: checkpointsTable.checkpointId,
      })
      .from(checkpointsTable)
      .where(eq(checkpointsTable.threadId, threadId))
      .orderBy(checkpointsTable.checkpointId);

    // Convert checkpoints to chat messages format
    const messages: ChatMessage[] = checkpoints.flatMap((checkpoint) => {
      const metadata = checkpoint.metadata as { role: "user" | "assistant" };
      return {
        id: checkpoint.id,
        role: metadata.role,
        content: checkpoint.checkpoint as string,
        createdAt: new Date(checkpoint.createdAt),
      };
    });

    console.log("---MESSAGES---", messages);

    return messages;
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw new Error("Failed to fetch chats");
  }
}
