"use server";

import { db } from "@/db";
import { documentHistoryTable } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, sql } from "drizzle-orm";

export async function createDocument() {
  const docId = uuidv4();

  await db.insert(documentHistoryTable).values({
    id: docId,
  });

  return docId;
}

export async function getDocuments() {
  const documents = await db
    .select({
      id: documentHistoryTable.id,
      content: documentHistoryTable.content,
      createdAt: documentHistoryTable.createdAt,
    })
    .from(documentHistoryTable)
    .orderBy(documentHistoryTable.createdAt);

  return documents;
}

export async function saveDocument(documentId: string, content: any) {
  await db
    .update(documentHistoryTable)
    .set({
      content: JSON.stringify(content),
    })
    .where(eq(documentHistoryTable.id, documentId));
}
