import { useToast } from './use-toast'
import { useState, useCallback } from 'react'

interface UseLoadingToastOptions {
  id: string
  message: string
  description?: string
  duration?: number
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

export const useLoadingToast = () => {
  const { toast } = useToast()
  const [toastId, setToastId] = useState<string | null>(null)

  const startLoadingToast = useCallback(
    ({
      id,
      message,
      description,
      variant = 'success',
    }: UseLoadingToastOptions) => {
      const { id: newToastId } = toast({
        id,
        variant,
        title: message,
        description,
        loading: true,
        duration: Infinity,
      })

      setToastId(newToastId)
      return newToastId
    },
    [toast]
  )

  const endLoadingToast = useCallback(
    ({
      id,
      message,
      description,
      variant = 'success',
      duration = 2000,
    }: UseLoadingToastOptions) => {
      toast({
        id,
        title: message,
        description,
        variant,
        loading: false,
        duration,
      })

      if (id === toastId) {
        setToastId(null)
      }
    },
    [toast, toastId]
  )

  return { startLoadingToast, endLoadingToast, activeToastId: toastId }
}
