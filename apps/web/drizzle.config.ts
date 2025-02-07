import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { env } from '@/env'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    database: 'postgres',
    port: 5432,
    host: 'aws-0-us-west-1.pooler.supabase.com',
    password: env.DATABASE_PASSWORD,
    user: env.DATABASE_USER,
    ssl: {
      rejectUnauthorized: false,
    },
  },
})
