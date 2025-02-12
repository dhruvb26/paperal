import { db } from '@/db'
import { usersTable } from '@/db/schema'
import { currentUser } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

export async function getUser() {
  try {
    const userClerk = await currentUser()

    if (!userClerk) {
      throw new Error('No user found.')
    }

    const userId = userClerk.id

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    })

    if (!user) {
      throw new Error('User not found in the database.')
    }

    return user
  } catch (error) {
    console.error('Error in getUser:', error)
    throw error
  }
}
