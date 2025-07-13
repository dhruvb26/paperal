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

    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    })

    if (!user) {
      console.log('User not found in database, creating user...')
      // Create the user if they don't exist
      const fullName = `${userClerk.firstName || ''} ${userClerk.lastName || ''}`.trim() || 'User'
      
      await db.insert(usersTable).values({
        id: userId,
        email: userClerk.emailAddresses[0]?.emailAddress || 'user@example.com',
        name: fullName,
        metadata: {
          clerkId: userId,
        },
      })

      // Fetch the newly created user
      user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      })

      if (!user) {
        throw new Error('Failed to create user in database.')
      }
    }

    return user
  } catch (error) {
    console.error('Error in getUser:', error)
    throw error
  }
}
