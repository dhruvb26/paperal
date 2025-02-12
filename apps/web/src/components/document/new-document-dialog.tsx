'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { createDocument } from '@/app/actions/documents'
import * as React from 'react'
import { useLoadingToast } from '@/hooks/use-loading-toast'
import { cn } from '@/lib/utils'

interface NewDocumentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function NewDocumentDialog({
  isOpen,
  onOpenChange,
}: NewDocumentDialogProps) {
  const [newDocPrompt, setNewDocPrompt] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)
  const router = useRouter()
  const { startLoadingToast, endLoadingToast } = useLoadingToast()
  const handleCreateDocument = async () => {
    if (!newDocPrompt.trim() || isCreating) return

    try {
      setIsCreating(true)
      startLoadingToast({
        id: 'create-document',
        message: 'Creating Document',
        description: 'Your document is being created.',
      })
      const newDoc = await createDocument(newDocPrompt)
      setNewDocPrompt('')
      onOpenChange(false)
      router.push(`/editor/${newDoc}`)
      endLoadingToast({
        id: 'create-document',
        message: 'Document Created',
        description: 'Your document is ready to use.',
      })
    } catch (error) {
      console.error('Error creating document:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Calculate progress based on character count
  const progress = Math.min((newDocPrompt.length / 100) * 100, 100)

  // Determine progress bar color based on progress
  const progressColor =
    progress < 33
      ? 'bg-red-500'
      : progress < 66
        ? 'bg-yellow-500'
        : 'bg-green-500'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
          <DialogDescription>
            Enter a prompt to start your research journey.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Textarea
            placeholder="Enter your prompt"
            className="h-20 items-start justify-start text-start"
            value={newDocPrompt}
            onChange={(e) => setNewDocPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateDocument()
              }
            }}
          />
          <div className="space-y-1">
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  progressColor
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-foreground">
              <span>weak</span>
              <span>strong</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateDocument}
            disabled={isCreating}
            isLoading={isCreating}
            loadingText="Creating"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
