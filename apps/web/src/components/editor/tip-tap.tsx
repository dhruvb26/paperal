'use client'
import SlashCommand from '@/extensions/slash-command/slash-command'
import './styles.scss'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React, { useCallback } from 'react'
import DragHandle from '@tiptap-pro/extension-drag-handle-react'
import { Mention } from '@tiptap/extension-mention'
import { FloatingMenuBar } from './floating-menu-bar'
import { Plus } from '@phosphor-icons/react'
import { useToast } from '@/hooks/use-toast'
import suggestion from '@/extensions/suggestion/suggestion'
import { saveDocument } from '@/app/actions/documents'
import { AiAutocompleteExtension } from '@/extensions/ai-autocomplete/ai-autocomplete'
import { CustomLink } from '@/extensions/custom-link/custom-link'
import { Highlight } from '@tiptap/extension-highlight'
import debounce from 'lodash/debounce'
import { useSettingsStore } from '@/stores/settings-store'
import { convertToLatex, downloadLatex } from '@/utils/latex-converter'
import { useUser } from '@clerk/nextjs'
import { Button } from '../ui/button'

interface TiptapProps {
  documentId: string
  initialContent: any
}
export default ({ documentId, initialContent }: TiptapProps) => {
  const { toast } = useToast()
  const { showAiSuggestions } = useSettingsStore()
  const { user } = useUser()

  if (!user) return null

  const debouncedSave = useCallback(
    debounce(async (editor) => {
      try {
        await saveDocument(
          documentId,
          JSON.parse(JSON.stringify(editor.getJSON()))
        )
      } catch (error) {
        toast({
          title: 'Error saving document',
          description: 'Your changes could not be saved.',
        })
      }
    }, 500),
    [documentId]
  )

  const editor = useEditor({
    content: initialContent,
    immediatelyRender: true,
    extensions: [
      StarterKit.configure(),
      ...(showAiSuggestions ? [AiAutocompleteExtension] : []),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: suggestion as any,
      }),
      SlashCommand,
      // Placeholder.configure({
      //   placeholder: ({ node }) => {
      //     return "Enter a heading or press '/' for commands";
      //   },
      // }),
      Underline,
      Highlight,
      CustomLink.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        isAllowedUri: (url, ctx) => {
          try {
            const parsedUrl = url.includes(':')
              ? new URL(url)
              : new URL(`${ctx.defaultProtocol}://${url}`)

            if (!ctx.defaultValidate(parsedUrl.href)) {
              return false
            }

            const disallowedProtocols = ['ftp', 'file', 'mailto']
            const protocol = parsedUrl.protocol.replace(':', '')

            if (disallowedProtocols.includes(protocol)) {
              return false
            }

            const allowedProtocols = ctx.protocols.map((p) =>
              typeof p === 'string' ? p : p.scheme
            )
            if (!allowedProtocols.includes(protocol)) {
              return false
            }

            const disallowedDomains = [
              'example-phishing.com',
              'malicious-site.net',
            ]
            if (disallowedDomains.includes(parsedUrl.hostname)) {
              return false
            }

            return true
          } catch (error) {
            return false
          }
        },
        shouldAutoLink: (url) => {
          try {
            const parsedUrl = url.includes(':')
              ? new URL(url)
              : new URL(`https://${url}`)
            const disallowedDomains = [
              'example-no-autolink.com',
              'another-no-autolink.com',
            ]
            return !disallowedDomains.includes(parsedUrl.hostname)
          } catch (error) {
            return false
          }
        },
      }),
    ].filter(Boolean),
    onCreate: () => {
      if (editor.state.doc.content.size > 0) {
        editor.commands.setTextSelection(editor.state.doc.content.size)
      } else {
        // If empty, find first paragraph for placeholder
        let placeholderPos = null
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'paragraph') {
            placeholderPos = pos
            return false
          }
        })

        if (placeholderPos !== null) {
          editor.commands.setTextSelection(placeholderPos)
        }
      }

      editor.commands.focus()
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor)
    },
  })

  React.useEffect(() => {
    return () => {
      debouncedSave.cancel()
    }
  }, [debouncedSave])

  const handlePlusClick = () => {
    if (editor) {
      // Move cursor to end of document
      editor.commands.selectParentNode()
      editor.commands.setTextSelection(editor.state.doc.content.size)

      // Create a new paragraph
      editor.chain().insertContent('<p>/</p>').focus().run()
    }
  }

  const handleExportLatex = useCallback(() => {
    if (!editor || !user) return

    const content = editor.getJSON()
    const latex = convertToLatex(content, {
      documentClass: 'article',
      user: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      },
      // date: "January 2025",
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    })

    downloadLatex(latex)
  }, [editor, user])

  if (!editor) return null

  return (
    <>
      {editor && (
        <div className="max-w-fit gap-4 flex justify-between items-center fixed left-1/2 -translate-x-1/2 top-0 z-10 py-6">
          <FloatingMenuBar editor={editor} />
          <Button onClick={handleExportLatex} variant="ghost">
            Export
          </Button>
        </div>
      )}

      <div className="flex items-center">
        <DragHandle editor={editor}>
          <button
            onClick={handlePlusClick}
            className="p-1.5 text-base hover:bg-muted rounded-sm mr-[3.25rem]"
          >
            <Plus weight="bold" size={12} className="text-foreground" />
          </button>
        </DragHandle>
      </div>

      <EditorContent editor={editor} className="text-base min-w-full" />
    </>
  )
}
