import { task } from '@trigger.dev/sdk/v3'
import axios from 'axios'
import { env } from '@/env'

interface LibraryEmbeddingsPayload {
  research_urls: string[]
  user_id: string
}

export const createLibraryEmbeddings = task({
  id: 'create-library-embeddings',
  maxDuration: 300,
  run: async (payload: LibraryEmbeddingsPayload, { ctx }) => {
    const { research_urls, user_id } = payload

    await axios.post(`${env.API_URL}/store`, {
      research_urls,
      user_id,
    })

    return {
      message: 'Embeddings created successfully.',
      status: 200,
    }
  },
})
