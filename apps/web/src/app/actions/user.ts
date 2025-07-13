'use server'

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

    // Try to find existing user first
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    if (existingUser.length > 0) {
      return existingUser[0]
    }

    // User doesn't exist, try to create them
    console.log('User not found in database, creating user...')
    const fullName = `${userClerk.firstName || ''} ${userClerk.lastName || ''}`.trim() || 'User'
    
    try {
      await db.insert(usersTable).values({
        id: userId,
        email: userClerk.emailAddresses[0]?.emailAddress || 'user@example.com',
        name: fullName,
        metadata: {
          clerkId: userId,
        },
      })
    } catch (insertError: any) {
      // If we get a constraint error, the user might have been created by webhook
      // Just continue and try to fetch the user again
      console.log('User creation failed, likely created by webhook:', insertError.message)
    }

    // Fetch the user again (either newly created or existing)
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    if (users.length === 0) {
      // Try one more time to check if user exists by email as fallback
      console.log('User not found by ID, trying to find by email...')
      const usersByEmail = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, userClerk.emailAddresses[0]?.emailAddress || ''))
        .limit(1)
      
      if (usersByEmail.length > 0) {
        console.log('Found user by email, returning that user')
        return usersByEmail[0]
      }
      
      console.error('User not found by ID or email. UserId:', userId, 'Email:', userClerk.emailAddresses[0]?.emailAddress)
      throw new Error(`Failed to create or find user in database. UserId: ${userId}`)
    }

    return users[0]
  } catch (error) {
    console.error('Error in getUser:', error)
    throw error
  }
}
