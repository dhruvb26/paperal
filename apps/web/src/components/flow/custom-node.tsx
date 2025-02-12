'use client'
import { Handle, Position } from '@xyflow/react'
import ReactMarkdown from 'react-markdown'
import React from 'react'
import rehypeRaw from 'rehype-raw'

const CustomNode = ({
  data,
  selected,
}: {
  data: {
    title?: string
    label: string
    backgroundColor?: string
    borderColor?: string
    textColor?: string
    fontSize?: string
  }
  selected?: boolean
}) => {
  const divRef = React.useRef<HTMLDivElement>(null)

  return (
    <div style={{ minHeight: '30px' }} className="max-w-md">
      <div
        ref={divRef}
        className="p-4 rounded-md border-[0.8px]"
        style={{
          backgroundColor: data.backgroundColor || 'hsl(var(--background))',
          borderColor: data.borderColor || 'hsl(var(--border))',
          color: data.textColor || 'hsl(var(--foreground))',
          width: '100%',
          minHeight: 'inherit',
        }}
      >
        <Handle type="target" position={Position.Left} className="w-2 h-2" />
        <Handle type="source" position={Position.Right} className="w-2 h-2" />
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        <div className="flex items-center">
          <div
            className="w-full whitespace-pre-wrap break-words flex flex-col gap-2"
            style={{ fontSize: data.fontSize || '0.675rem' }}
          >
            {/* {data.title && (
              <span
                className="font-semibold"
                style={{ fontSize: data.fontSize || "0.5rem" }}
              >
                {data.title}
              </span>
            )} */}
            <ReactMarkdown
              components={{
                // Default text styles
                p: ({ node, ...props }) => (
                  <p {...props} style={{ fontSize: '0.675rem' }} />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-2xl font-bold mt-4 mb-2" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-xl font-semibold mt-3" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-lg font-semibold mt-3" />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    {...props}
                    className="relative border-l border-input ml-2 px-2"
                  />
                ),
                ol: ({ node, ...props }) => <ol {...props} className=" " />,
                li: ({ node, ...props }) => (
                  <li
                    {...props}
                    className="flex text-xs gap-1 m-0 leading-relaxed relative"
                  >
                    <span className="select-none relative left-[-12px] text-black">
                      •
                    </span>
                    <span>{props.children}</span>
                  </li>
                ),
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('Clicked link:', props.href)
                    }}
                    className="text-blue-500 hover:underline"
                  />
                ),
                code: ({ node, ...props }) => (
                  <code
                    {...props}
                    className="bg-gray-100 rounded px-1 py-0.5"
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    {...props}
                    className="border-l-4 border-gray-200 pl-4 my-2"
                  />
                ),
              }}
              remarkPlugins={[]}
              rehypePlugins={[rehypeRaw]}
            >
              {data.label}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomNode
