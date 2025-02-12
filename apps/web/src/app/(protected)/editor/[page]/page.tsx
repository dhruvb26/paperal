'use client'

import { useParams } from 'next/navigation'
import { getDocument } from '@/app/actions/documents'
import { useEffect, useState } from 'react'
import Tiptap from '@/components/editor/tip-tap'
import { Loader } from '@/components/ui/loader'
import { SidebarRight } from '@/components/sidebar-right'
import { Document } from '@/types/models/document'
import { Button } from '@/components/ui/button'
import { Chats } from '@phosphor-icons/react'
import { useSidebarStore } from '@/store/sidebar-store'

export default function EditorPage() {
  const params = useParams()
  const documentId = params.page
  const [document, setDocument] = useState<Document[] | null>(null)
  const toggleRightSidebar = useSidebarStore(
    (state) => state.toggleRightSidebar
  )
  const isRightSidebarOpen = useSidebarStore(
    (state) => state.isRightSidebarOpen
  )

  useEffect(() => {
    const fetchDocument = async () => {
      const doc = await getDocument(documentId as string)
      setDocument(doc as Document[])
    }
    fetchDocument()
  }, [documentId])

  return (
    <>
      {!document ? (
        <div className="w-full flex h-screen items-center justify-center">
          <Loader className="text-muted-foreground" />
        </div>
      ) : (
        <div className="flex h-screen relative overflow-x-hidden">
          <div className="flex-1 overflow-y-scroll p-20">
            <Tiptap
              documentId={documentId as string}
              initialContent={document[0].content}
            />
          </div>
          <SidebarRight />
          <Button
            onClick={toggleRightSidebar}
            className={`fixed bottom-3  ${
              isRightSidebarOpen
                ? 'right-[calc(384px+2rem)]'
                : 'right-4 sm:right-8'
            }`}
            size="icon"
          >
            <Chats size={16} />
          </Button>
        </div>
      )}
    </>
  )
}
