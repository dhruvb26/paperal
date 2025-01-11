"use server";

import { db } from "@/db";
import { citationsTable } from "@/db/schema";

interface Citation {
  documentId: string;
  sentence: string;
  citation: string;
  context: string;
}

export async function storeCitation(request: Citation) {
  const { documentId, sentence, citation, context } = request;
  await db
    .insert(citationsTable)
    .values({ documentId, sentence, citation, context });
}
