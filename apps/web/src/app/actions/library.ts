"use server";

import { db } from "@/db";
import { libraryTable } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function createLibrary(
  title: string,
  description: string,
  isPublic: boolean = true
) {
  const libraryId = uuidv4();
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  await db.insert(libraryTable).values({
    id: libraryId,
    title,
    description,
    userId,
    isPublic,
    metadata: {},
  });

  return libraryId;
}

export async function getLibraries() {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return [];
  }

  const libraries = await db
    .select()
    .from(libraryTable)
    .where(eq(libraryTable.userId, userId));
  return libraries;
}

export async function getLibrary(libraryId: string) {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  const library = await db
    .select()
    .from(libraryTable)
    .where(
      and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId))
    );

  return library;
}

export async function updateLibrary(
  libraryId: string,
  data: {
    title?: string;
    description?: string;
    isPublic?: boolean;
    metadata?: any;
  }
) {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  await db
    .update(libraryTable)
    .set(data)
    .where(
      and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId))
    );
}

export async function deleteLibrary(libraryId: string) {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  await db
    .delete(libraryTable)
    .where(
      and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId))
    );

  return true;
}
