import React from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DotsThreeVertical } from '@phosphor-icons/react'
import { getDocContent, getDocDate, getDocHeading } from '@/utils/render-doc'
import { Document } from '@/types/models/document'

interface DocumentListProps {
  documents: Document[]
  searchQuery: string
  sortDesc: boolean
  pathname: string
  setDocumentToDelete: (id: string | null) => void
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  searchQuery,
  sortDesc,
  pathname,
  setDocumentToDelete,
}) => {
  const filteredDocuments = documents
    .filter((document) => {
      const title = getDocHeading(document.content)?.toLowerCase() || ''
      const content = getDocContent(document.content)?.toLowerCase() || ''
      const query = searchQuery.toLowerCase()

      return title.includes(query) || content.includes(query)
    })
    .sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt
      const dateB = b.updatedAt || b.createdAt
      return sortDesc
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime()
    })

  return (
    <div>
      {filteredDocuments.map((document) => (
        <div
          key={document.id}
          className={`flex flex-col items-start gap-2 whitespace-nowrap border-b p-2 text-sm leading-tight ${
            pathname === `/editor/${document.id}`
              ? 'bg-background text-sidebar-accent-foreground'
              : ''
          }`}
        >
          <div className="flex w-full items-center">
            <Link href={`/editor/${document.id}`} className="flex-1 truncate">
              <span className="font-medium truncate hover:underline">
                {getDocHeading(document.content)}
              </span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <DotsThreeVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDocumentToDelete(document.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <span className="line-clamp-2 w-[260px] text-muted-foreground whitespace-break-spaces text-xs">
            {getDocContent(document.content)}
          </span>
          <span className="text-xs text-muted-foreground italic">
            {getDocDate(document.createdAt)}
          </span>
        </div>
      ))}
      {filteredDocuments.length === 0 && (
        <div className="p-4 text-sm text-center w-full">No results found.</div>
      )}
    </div>
  )
}
