'use server'

import { db } from '@/db'
import { checkpointsTable } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages'
import { convertLangChainMessageToVercelMessage } from '@/utils/lang'
import { auth } from '@clerk/nextjs/server'

export async function getChats(threadId: string): Promise<any[]> {
  try {
    const checkpoints = await db
      .select({
        id: checkpointsTable.id,
        metadata: checkpointsTable.metadata,
      })
      .from(checkpointsTable)
      .where(
        and(
          eq(checkpointsTable.threadId, threadId),

          sql`${checkpointsTable.metadata}->>'writes' IS NOT NULL`,
          sql`${checkpointsTable.metadata}->>'writes' != 'null'`
        )
      )
      .orderBy(checkpointsTable.checkpointId)

    // Transform checkpoints into LangChain messages
    const messages = checkpoints
      .map((checkpoint) => {
        const metadata = checkpoint.metadata as {
          writes?: {
            __start__?: { messages: any[] }
            queryOrRespond?: { messages: any[] }
            __end__?: { messages: any[] }
          } | null
          source?: string
        }

        // For human messages (step -1), take the last message from __start__
        if (metadata.source === 'input') {
          const messages = metadata.writes?.__start__?.messages || []
          const lastMessage = messages[messages.length - 1]

          if (!lastMessage) return null

          const convertedMessage = convertLangChainMessageToVercelMessage(
            new HumanMessage(lastMessage.kwargs.content)
          )
          return { ...convertedMessage, id: checkpoint.id }
        }

        // For AI messages, keep the existing logic
        const message =
          metadata.writes?.queryOrRespond?.messages?.[0] ||
          metadata.writes?.__start__?.messages?.[0]

        if (!message) return null

        const isHuman = message.id.includes('HumanMessage')
        const convertedMessage = convertLangChainMessageToVercelMessage(
          isHuman
            ? new HumanMessage(message.kwargs.content)
            : new AIMessage(message.kwargs.content)
        )
        return { ...convertedMessage, id: checkpoint.id }
      })
      .filter(Boolean)

    return messages
  } catch (error) {
    console.error('Error fetching chats:', error)
    throw new Error('Failed to fetch chats')
  }
}
