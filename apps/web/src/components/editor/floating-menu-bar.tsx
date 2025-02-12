'use client'
import { Editor } from '@tiptap/react'
import {
  TextB,
  TextHOne,
  TextHTwo,
  TextHThree,
  TextItalic,
  TextStrikethrough,
  ListBullets,
  ListNumbers,
  Highlighter,
  TextUnderline,
  TextT,
  CodeSimple,
  Quotes,
  CaretUpDown,
  Link as LinkIcon,
  X,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Input } from '../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'

export const FloatingMenuBar = ({ editor }: { editor: Editor }) => {
  const [linkUrl, setLinkUrl] = useState('')
  const [isLinkOpen, setIsLinkOpen] = useState(false)

  if (!editor) {
    return null
  }

  const textStyles = [
    { label: 'Paragraph', value: 'paragraph', icon: <TextT size={16} /> },
    { label: 'H1', value: 'h1', icon: <TextHOne size={16} /> },
    { label: 'H2', value: 'h2', icon: <TextHTwo size={16} /> },
    { label: 'H3', value: 'h3', icon: <TextHThree size={16} /> },
  ]

  const getCurrentStyleIndex = () => {
    for (let i = 1; i <= 3; i++) {
      if (editor.isActive('heading', { level: i })) {
        return i
      }
    }
    return 0 // paragraph
  }

  const cycleTextStyle = () => {
    const currentIndex = getCurrentStyleIndex()
    const nextIndex = (currentIndex + 1) % textStyles.length

    if (nextIndex === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: nextIndex as any })
        .run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setIsLinkOpen(true)
  }

  const handleLinkSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (linkUrl === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      } else {
        try {
          let formattedUrl = linkUrl
          if (!/^https?:\/\//i.test(linkUrl) && !linkUrl.startsWith('/')) {
            formattedUrl = `https://${linkUrl}`
          }

          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: formattedUrl })
            .run()
        } catch (e: any) {
          alert(e.message)
        }
      }
      setIsLinkOpen(false)
    }
  }

  return (
    <div className="flex flex-nowrap p-1 gap-1 shadow-md rounded-lg border  bg-blue-600 max-w-fit  transform hover:translate-y-[-2px] transition-transform duration-200 border-b-4 border-blue-900">
      <Button
        className={`  hover:bg-blue-500 text-white hover:text-white ${
          editor.isActive('textStyle') ? 'bg-blue-400 ' : 'bg-blue-600'
        }`}
        variant="ghost"
        size="sm"
        onClick={cycleTextStyle}
      >
        {textStyles[getCurrentStyleIndex()].icon}
        <CaretUpDown size={12} />
      </Button>
      <Button
        className={`h-8 w-8  text-white hover:bg-blue-500 hover:text-white ${
          editor.isActive('bold') ? 'bg-blue-500' : 'bg-blue-600 '
        }`}
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextB size={12} />
      </Button>
      <Button
        className={`h-8 w-8  text-white hover:bg-blue-500 hover:text-white ${
          editor.isActive('italic') ? 'bg-blue-500' : 'bg-blue-600 '
        }`}
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalic size={12} />
      </Button>
      <Button
        className={`h-8 w-8  text-white hover:bg-blue-500 hover:text-white ${
          editor.isActive('underline') ? 'bg-blue-500' : 'bg-blue-600 '
        }`}
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <TextUnderline size={12} />
      </Button>
      <Button
        className={`h-8 w-8  text-white hover:bg-blue-500 hover:text-white ${
          editor.isActive('strike') ? 'bg-blue-500' : 'bg-blue-600 '
        }`}
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough size={12} />
      </Button>{' '}
      <Button
        className={`h-8 w-8  text-white hover:bg-blue-500 hover:text-white ${
          editor.isActive('bulletList') ? 'bg-blue-500' : 'bg-blue-600 '
        }`}
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBullets size={12} />
      </Button>
      <Button
        className={`h-8 w-8  text-white hover:bg-blue-500 hover:text-white ${
          editor.isActive('orderedList') ? 'bg-blue-500' : 'bg-blue-600 '
        }`}
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers size={12} />
      </Button>
      <Popover open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={setLink}
            className={`h-8 w-8  text-white hover:bg-blue-500 hover:text-white ${
              editor.isActive('link') ? 'bg-blue-500' : 'bg-blue-600 '
            }`}
          >
            <LinkIcon size={12} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          className=" border-none shadow-none bg-transparent"
        >
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkSubmit}
            placeholder="Enter or paste a link"
            autoFocus={false}
          />
        </PopoverContent>
      </Popover>
      {editor.isActive('link') && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8  text-white hover:bg-blue-500 hover:text-white "
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <X size={12} className="" />
        </Button>
      )}
    </div>
  )
}
