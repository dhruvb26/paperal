import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@clerk/nextjs/server'
import { env } from '@/env'
import axios from 'axios'

const f = createUploadthing()

export const ourFileRouter = {
  pdfUploader: f({
    pdf: {
      maxFileSize: '8MB',
    },
  })
    .middleware(async ({ req }) => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError('Unauthorized')

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const research_urls = [file.url]

      await axios.post(`${env.API_URL}/store`, {
        research_urls,
        user_id: metadata.userId,
      })

      return { uploadedBy: metadata.userId, fileUrl: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
