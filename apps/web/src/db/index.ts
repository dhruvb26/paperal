import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/env'
import * as schema from './schema'

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  connection: {
    options: `--search_path=public`,
  },
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout in seconds
})
if (env.NODE_ENV !== 'production') globalForDb.conn = conn

export const db = drizzle(conn, { schema })
