import {
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const documentsTable = pgTable("documents", {
  id: uuid()
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  content: text(),
  metadata: jsonb(),
  embedding: vector("embedding", { dimensions: 1536 }),
});
