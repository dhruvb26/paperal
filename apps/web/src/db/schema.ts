import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  metadata: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).$onUpdate(() => new Date()),
});

export const documentsTable = pgTable("documents", {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  content: text(),
  metadata: jsonb(),
  embedding: vector("embedding", { dimensions: 1536 }),
});

export const documentHistoryTable = pgTable("document_history", {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  content: jsonb("content"),
  userId: varchar("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).$onUpdate(() => new Date()),
});

export const libraryTable = pgTable("library", {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  title: varchar({ length: 255 }).notNull(),
  userId: varchar("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  metadata: jsonb(), // contains the file url, authors, citations, and year etc.
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).$onUpdate(() => new Date()),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  documentHistory: many(documentHistoryTable),
  libraries: many(libraryTable),
}));

export const documentHistoryRelations = relations(
  documentHistoryTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [documentHistoryTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const libraryRelations = relations(libraryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [libraryTable.userId],
    references: [usersTable.id],
  }),
}));
