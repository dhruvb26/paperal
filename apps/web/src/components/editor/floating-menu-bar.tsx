"use client";
import { BubbleMenu } from "@tiptap/react";
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
  CaretDown,
  CaretUpDown,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/core";
import { useState, useRef, useEffect } from "react";

export const FloatingMenuBar = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const textStyles = [
    {
      label: "Paragraph",
      value: "paragraph",
      icon: <TextT size={16} />,
      action: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: "Heading 1",
      value: "h1",
      icon: <TextHOne size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      value: "h2",
      icon: <TextHTwo size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      value: "h3",
      icon: <TextHThree size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bullet List",
      value: "bulletList",
      icon: <ListBullets size={16} />,
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered List",
      value: "orderedList",
      icon: <ListNumbers size={16} />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  const getActiveStyle = () => {
    for (let i = 1; i <= 3; i++) {
      if (editor.isActive("heading", { level: i })) {
        return textStyles.find((style) => style.value === `h${i}`);
      }
    }

    const blockFormats = ["bulletList", "orderedList"];
    for (const format of blockFormats) {
      if (editor.isActive(format)) {
        return textStyles.find((style) => style.value === format);
      }
    }

    return textStyles.find((style) => style.value === "paragraph");
  };

  const activeStyle = getActiveStyle();

  return (
    <BubbleMenu
      className="flex flex-nowrap gap-1 p-1 rounded-md bg-white shadow-sm border w-fit"
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      shouldShow={({ editor, view, state, oldState, from, to }) => {
        return from !== to;
      }}
    >
      <div className="relative" ref={menuRef}>
        <button
          className="flex items-center gap-1 p-2 text-xs hover:bg-gray-100 rounded-sm min-w-[9rem] cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {activeStyle?.icon}
          <span className="ml-1">{activeStyle?.label}</span>
          <CaretUpDown size={12} className="ml-auto" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 max-h-96 min-w-[10rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <div className="p-1">
              {textStyles.map((style) => (
                <button
                  key={style.value}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-xs outline-none hover:bg-gray-100 ${
                    editor.isActive(style.value) ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    style.action();
                    setIsOpen(false);
                  }}
                >
                  {style.icon}
                  <span className="ml-2">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${
          editor.isActive("bold") ? "bg-gray-100" : ""
        }`}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextB size={16} />
      </button>
      <button
        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${
          editor.isActive("italic") ? "bg-gray-100" : ""
        }`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalic size={16} />
      </button>
      <button
        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${
          editor.isActive("underline") ? "bg-gray-100" : ""
        }`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <TextUnderline size={16} />
      </button>
      <button
        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${
          editor.isActive("strike") ? "bg-gray-100" : ""
        }`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough size={16} />
      </button>
      <button
        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${
          editor.isActive("highlight") ? "bg-gray-100" : ""
        }`}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="w-4 h-4" />
      </button>
      <button
        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${
          editor.isActive("code") ? "bg-gray-100" : ""
        }`}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <CodeSimple size={16} />
      </button>
      <button
        className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${
          editor.isActive("blockquote") ? "bg-gray-100" : ""
        }`}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quotes size={16} />
      </button>
    </BubbleMenu>
  );
};
