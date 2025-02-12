import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { libraryTable } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathname = req.nextUrl.pathname
    const fileUrl = decodeURIComponent(pathname.split('/').pop() || '')

    const document = await db.query.libraryTable.findFirst({
      where: eq(sql`${libraryTable.metadata}->>'fileUrl'`, fileUrl),
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    const isInLibrary = userId && document.userId === userId

    return NextResponse.json(
      {
        ...document,
        isInLibrary,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
