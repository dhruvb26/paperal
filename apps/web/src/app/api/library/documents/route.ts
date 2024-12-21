import { db } from "@/db";
import { libraryTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await db.query.libraryTable.findMany({
      where: eq(libraryTable.userId, userId),
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching library documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}