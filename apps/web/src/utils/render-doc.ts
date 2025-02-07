interface TextNode {
  type: 'text'
  text: string
}

interface HeadingNode {
  type: 'heading'
  attrs: {
    level: number
  }
  content: TextNode[]
}

interface ParagraphNode {
  type: 'paragraph'
  content: (HeadingNode | TextNode)[]
}

interface Doc {
  type: 'doc'
  content: ParagraphNode[]
}

export const getDocHeading = (docString: string): string => {
  try {
    const content =
      typeof docString === 'string' ? JSON.parse(docString) : docString

    const firstHeading = content.content.find(
      (node: any) => node.type === 'heading'
    )

    return firstHeading?.content?.[0]?.text || 'Untitled Document'
  } catch (error) {
    return ''
  }
}

export const getDocContent = (docString: string): string => {
  try {
    const content =
      typeof docString === 'string' ? JSON.parse(docString) : docString

    return (
      content.content
        .filter((node: any) => node.type === 'paragraph' && node.content)
        .flatMap((node: any) =>
          node.content.map((contentNode: any) => contentNode.text)
        )
        .join(' ') || 'Nothing here yet. Start writing now!'
    )
  } catch (error) {
    return ''
  }
}

export const getDocDate = (date: Date): string => {
  try {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return 'Today'
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString()
    }
  } catch (error) {
    return ''
  }
}
