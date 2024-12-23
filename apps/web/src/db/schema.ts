import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(
    () => new Date()
  ),
});

export const embeddingsTable = pgTable("embeddings", {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  content: text("content"),
  metadata: jsonb("metadata"),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const documentsTable = pgTable("documents", {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  content: jsonb("content"),
  prompt: text("prompt"),
  userId: varchar("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(
    () => new Date()
  ),
});

export const libraryTable = pgTable("library", {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  title: varchar({ length: 255 }).notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  isPublic: boolean("is_public").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  documents: many(documentsTable),
  libraries: many(libraryTable),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [documentsTable.userId],
    references: [usersTable.id],
  }),
}));

export const libraryRelations = relations(libraryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [libraryTable.userId],
    references: [usersTable.id],
  }),
}));
