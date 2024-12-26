"use server";

import { db } from "@/db";
import { documentsTable } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createEmbeddings } from "@/trigger/embeddings";
import { tasks } from "@trigger.dev/sdk/v3";
import axios from "axios";
import { env } from "@/env";

export async function createDocument(prompt: string) {
  const docId = uuidv4();
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  const response = await axios.post(
    `${env.API_URL}/research_topic?query=${prompt}`
  );

  const researchTopic = response.data.research_topic;
  const cleanedResearchTopic = researchTopic.replace(/['"]+/g, "");

  await tasks.trigger<typeof createEmbeddings>("create-embeddings", {
    prompt,
  });

  const defaultContent = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: {
          level: 1,
        },
        content: [
          {
            type: "text",
            text: cleanedResearchTopic,
          },
        ],
      },
      {
        type: "paragraph",
      },
    ],
  };

  await db.insert(documentsTable).values({
    id: docId,
    content: JSON.stringify(defaultContent),
    prompt: prompt,
    title: researchTopic,
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

  await db
    .delete(documentsTable)
    .where(
      and(eq(documentsTable.id, documentId), eq(documentsTable.userId, userId))
    );

  return true;
}
