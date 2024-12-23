"use server";

import { db } from "@/db";
import { documentsTable } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";

export async function createDocument(prompt: string) {
  const docId = uuidv4();
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  const defaultContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      },
    ],
  };

  await db.insert(documentsTable).values({
    id: docId,
    content: JSON.stringify(defaultContent),
    prompt: prompt,
    userId: userId,
  });

  return docId;
}

export async function getDocuments() {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return [];
  }

  const documents = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, userId));
  return documents;
}

export async function saveDocument(documentId: string, content: any) {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  await db
    .update(documentsTable)
    .set({
      content: JSON.stringify(content),
    })
    .where(
      and(eq(documentsTable.id, documentId), eq(documentsTable.userId, userId))
    );
}

export async function getDocument(documentId: string) {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  const document = await db
    .select()
    .from(documentsTable)
    .where(
      and(eq(documentsTable.id, documentId), eq(documentsTable.userId, userId))
    );

  return document;
}

export async function deleteDocument(documentId: string) {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  await db.delete(documentsTable).where(eq(documentsTable.id, documentId));
}
