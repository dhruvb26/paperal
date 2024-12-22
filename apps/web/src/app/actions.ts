"use server";
import { documentHistoryTable } from "@/db/schema";
import { db } from "@/db";

export async function getDocuments() {
  const documents = await db.select().from(documentHistoryTable);
  return documents;
}
