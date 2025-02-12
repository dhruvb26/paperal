import { db } from '@/db'
import { and, eq, isNull, or } from 'drizzle-orm'
import { libraryTable } from '@/db/schema'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documents = await db.query.libraryTable.findMany({
      where: or(eq(libraryTable.userId, userId), isNull(libraryTable.userId)),
    })
    return NextResponse.json({ documents }, { status: 200 })
  } catch (error) {
    console.error('Error fetching discover documents:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
