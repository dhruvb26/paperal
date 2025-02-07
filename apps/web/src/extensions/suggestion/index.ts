export interface LibraryDocument {
  id: string
  title: string
  description: string
  userId: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date | null
  metadata?: {
    fileUrl?: string
    authors?: string[]
    year?: string
    citations?: {
      'in-text'?: string
      'after-text'?: string
    }
  }
}
