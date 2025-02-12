import {
  BaseMessage,
  ChatMessage,
  HumanMessage,
  AIMessage,
} from '@langchain/core/messages'
import type { Message } from 'ai'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TurndownService from 'turndown'

export const convertVercelMessageToLangChainMessage = (
  message: Message
): BaseMessage => {
  switch (message.role) {
    case 'user':
      return new HumanMessage({ content: message.content })
    case 'assistant':
      return new AIMessage({ content: message.content })
    default:
      return new ChatMessage({ content: message.content, role: message.role })
  }
}

export const convertLangChainMessageToVercelMessage = (
  message: BaseMessage
) => {
  switch (message.getType()) {
    case 'human':
      return {
        id: message.id,
        content: message.content,
        role: 'user',
      }
    case 'ai':
      return {
        id: message.id,
        content: message.content,
        role: 'assistant',
        tool_calls: (message as AIMessage).tool_calls,
      }
    default:
      return { content: message.content, role: message._getType() }
  }
}

export async function convertToMarkdown(prosemirrorJson: any): Promise<string> {
  // Convert ProseMirror JSON to HTML with Link extension
  const html = generateHTML(prosemirrorJson, [StarterKit, Link])

  // Convert HTML to Markdown
  const turndownService = new TurndownService()
  return turndownService.turndown(html)
}
