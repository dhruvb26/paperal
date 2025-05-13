export interface LibraryDocument {
  id: string
  title: string
  description: string
  userId: string | null
  isPublic: boolean
  createdAt: Date
  metadata?: any
}
