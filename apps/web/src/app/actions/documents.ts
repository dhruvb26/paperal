'use server'

import { db } from '@/db'
import { documentsTable } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'
import { currentUser } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { env } from '@/env'

export async function createDocument(prompt: string) {
  const docId = uuidv4()
  const user = await currentUser()
  const userId = user?.id

  if (!userId) {
    throw new Error('User not found')
  }

  const response = await fetch(`${env.API_URL}/topic`, {
    method: 'POST',
    body: JSON.stringify({ query: prompt }),
    headers: { 'Content-Type': 'application/json' },
  })

  const {
    data: { main_topic: topic },
  } = await response.json()

  const defaultContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: topic }],
      },
      { type: 'paragraph' },
    ],
  }

  // const {
  //   data: { urls: urls },
  // } = await fetch(`${env.API_URL}/search`, {
  //   method: 'POST',
  //   body: JSON.stringify({ topic }),
  //   headers: { 'Content-Type': 'application/json' },
  // }).then((res) => res.json())

  const [document] = await Promise.all([
    db
      .insert(documentsTable)
      .values({
        id: docId,
        content: JSON.stringify(defaultContent),
        prompt,
        title: prompt,
        userId,
      })
      .returning(),

    // fetch(`${env.API_URL}/process`, {
    //   method: 'POST',
    //   body: JSON.stringify({ urls }),
    //   headers: { 'Content-Type': 'application/json' },
    // }).then((res) => res.json()),
  ])

  return document[0].id
}

export async function getDocuments() {
  const user = await currentUser()
  const userId = user?.id

  if (!userId) {
    return []
  }

  const documents = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, userId))
  return documents
}

export async function saveDocument(documentId: string, content: any) {
  const user = await currentUser()
  const userId = user?.id

  if (!userId) {
    throw new Error('User not found')
  }

  await db
    .update(documentsTable)
    .set({
      content: JSON.stringify(content),
    })
    .where(
      and(eq(documentsTable.id, documentId), eq(documentsTable.userId, userId))
    )
}

export async function getDocument(documentId: string) {
  const user = await currentUser()
  const userId = user?.id

  if (!userId) {
    throw new Error('User not found')
  }

  const document = await db
    .select()
    .from(documentsTable)
    .where(
      and(eq(documentsTable.id, documentId), eq(documentsTable.userId, userId))
    )

  return document
}

export async function deleteDocument(documentId: string) {
  const user = await currentUser()
  const userId = user?.id

  if (!userId) {
    throw new Error('User not found')
  }

  await db
    .delete(documentsTable)
    .where(
      and(eq(documentsTable.id, documentId), eq(documentsTable.userId, userId))
    )

  return true
}
