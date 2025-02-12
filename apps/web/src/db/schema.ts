import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  customType,
  boolean,
  doublePrecision,
  json,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { vector } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: varchar({ length: 255 }).primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date())
    .default(sql`CURRENT_TIMESTAMP`),
})

const tsvector = customType<{ data: string }>({
  dataType() {
    return `tsvector`
  },
})

export const embeddingsTable = pgTable('embeddings', {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  content: text('content'),
  metadata: jsonb('metadata'),
  embedding: vector('embedding', { dimensions: 1536 }),
  fts: tsvector('fts'),
  similarity: doublePrecision('similarity'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date())
    .default(sql`CURRENT_TIMESTAMP`),
})

export const documentsTable = pgTable('documents', {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  content: jsonb('content').notNull(),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  userId: varchar('user_id')
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date())
    .default(sql`CURRENT_TIMESTAMP`),
})

export const libraryTable = pgTable('library', {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  title: varchar({ length: 255 }).notNull(),
  description: text('description').notNull(),
  userId: varchar('user_id').references(() => usersTable.id, {
    onDelete: 'cascade',
  }),
  isPublic: boolean('is_public').default(true).notNull(),
  metadata: jsonb('metadata').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date())
    .default(sql`CURRENT_TIMESTAMP`),
})

export const usersRelations = relations(usersTable, ({ many }) => ({
  documents: many(documentsTable),
  libraries: many(libraryTable),
}))

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [documentsTable.userId],
    references: [usersTable.id],
  }),
}))

export const libraryRelations = relations(libraryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [libraryTable.userId],
    references: [usersTable.id],
  }),
}))

export const citationsTable = pgTable('citations', {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  documentId: uuid()
    .references(() => documentsTable.id, { onDelete: 'cascade' })
    .notNull(),
  sentence: text('sentence').notNull(),
  citation: text('citation').notNull(),
  context: text('context').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date())
    .default(sql`CURRENT_TIMESTAMP`),
})

export const checkpointsTable = pgTable(
  'checkpoints',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    threadId: text('thread_id').notNull(),
    checkpointNs: text('checkpoint_ns').notNull(),
    checkpointId: text('checkpoint_id').notNull(),
    parentCheckpointId: text('parent_checkpoint_id'),
    type: text('type'),
    checkpoint: jsonb('checkpoint'),
    metadata: jsonb('metadata'),
  },
  (table) => {
    return {
      threadIdNsIdIdx: uniqueIndex('thread_ns_id_idx').on(
        table.threadId,
        table.checkpointNs,
        table.checkpointId
      ),
    }
  }
)

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

export const checkpointBlobsTable = pgTable(
  'checkpoint_blobs',
  {
    threadId: text('thread_id').notNull(),
    checkpointNs: text('checkpoint_ns').notNull(),
    channel: text('channel').notNull(),
    version: text('version').notNull(),
    type: text('type'),
    blob: bytea('blob'),
  },
  (table) => {
    return {
      unq: uniqueIndex('checkpoint_blobs_unique_idx').on(
        table.threadId,
        table.checkpointNs,
        table.channel,
        table.version
      ),
    }
  }
)

export const checkpointWritesTable = pgTable(
  'checkpoint_writes',
  {
    threadId: text('thread_id').notNull(),
    checkpointNs: text('checkpoint_ns').notNull(),
    checkpointId: text('checkpoint_id').notNull(),
    taskId: text('task_id').notNull(),
    idx: integer('idx').notNull(),
    channel: text('channel'),
    type: text('type'),
    blob: bytea('blob'),
  },
  (table) => {
    return {
      unq: uniqueIndex('checkpoint_writes_unique_idx').on(
        table.threadId,
        table.checkpointNs,
        table.checkpointId,
        table.taskId,
        table.idx
      ),
    }
  }
)

export const checkpointMigrationsTable = pgTable('checkpoint_migrations', {
  v: integer('v').primaryKey(),
})
