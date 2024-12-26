import { db } from "@/db";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const documents = await db.query.libraryTable.findMany();
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching discover documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
