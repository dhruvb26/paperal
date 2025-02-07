import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from './core'
import { env } from '@/env'

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: { isDev: env.NODE_ENV === 'development' },
})
