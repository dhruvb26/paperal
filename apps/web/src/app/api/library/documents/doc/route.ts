import { NextResponse } from "next/server";
import { db } from "@/db";
import { libraryTable } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
