import { NextResponse } from "next/server";
import { db } from "@/db";
import { libraryTable } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const { href } = (await request.json()) as { href: string };

    const document = await db.query.libraryTable.findFirst({
      where: sql`${libraryTable.metadata}->>'fileUrl' = ${href}`,
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if the document belongs to the user's library
    const isInLibrary = userId && document.userId === userId;

    return NextResponse.json({
      ...document,
      isInLibrary,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
