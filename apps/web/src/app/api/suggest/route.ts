import { NextResponse } from "next/server";
import { env } from "@/env";
import axios from "axios";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { documentsTable, libraryTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";

interface Metadata {
  fileUrl: string;
  citations: {
    "in-text": string;
    "after-text"?: string;
  };
}

export async function POST(request: Request) {
  try {
    // const { userId } = await auth();

    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // const body = (await request.json()) as {
    //   previousText: string;
    //   documentId: string;
    // };

    // const document = await db
    //   .select()
    //   .from(documentsTable)
    //   .where(eq(documentsTable.id, body.documentId));

    // const response = await axios.post(`${env.API_URL}/generate`, {
    //   previous_text: body.previousText,
    //   heading: document[0].title,
    // });

    // const suggestion = response.data;

    // if (suggestion.library_id) {
    //   const libraryDoc = await db
    //     .select()
    //     .from(libraryTable)
    //     .where(eq(libraryTable.id, suggestion.library_id));

    //   const metadata = libraryDoc[0].metadata as Metadata;
    //   const citations = metadata.citations;

    //   if (libraryDoc[0]) {
    //     return NextResponse.json({
    //       text: suggestion.referenced_sentence,
    //       is_referenced: true,
    //       citations: {
    //         "in-text": citations["in-text"],
    //         "after-text": citations["after-text"],
    //       },
    //       href: metadata.fileUrl,
    //     });
    //   }
    // }

    // return NextResponse.json(
    //   {
    //     text: suggestion.ai_sentence,
    //     is_referenced: false,
    //     href: undefined,
    //   },
    //   { status: 200 }
    // );
    return NextResponse.json({
      text: "Here is some sentence",
      is_referenced: true,
      citations: {
        "in-text": "(Dhruv et al., 2024)",
        "after-text": "(Dhruv et al., 2024)",
      },
      href: "https://www.google.com",
    });
  } catch (error) {
    console.error("Error generating suggestion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
