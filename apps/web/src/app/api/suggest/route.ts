import { NextResponse } from "next/server";
import { env } from "@/env";
import axios from "axios";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { documentsTable, libraryTable } from "@/db/schema";

interface SuggestionResponse {
  ai_sentence: string;
  is_reference: boolean;
  library_id: string | null;
}

interface Metadata {
  url: string;
  citations: {
    "in-text": string;
    "after-text": string;
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    previousText: string;
    documentId: string;
  };

  const document = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, body.documentId));

  const response = await axios.post(`${env.API_URL}/generate`, {
    previous_text: body.previousText,
    heading: document[0].title,
  });

  console.log(response.data);

  const suggestion = response.data;

  if (suggestion.library_id) {
    const libraryDoc = await db
      .select()
      .from(libraryTable)
      .where(eq(libraryTable.id, suggestion.library_id));

    const metadata = libraryDoc[0].metadata as Metadata;
    const citations = metadata.citations;

    if (libraryDoc[0]) {
      console.log("Returning citation sentence");
      return NextResponse.json({
        text: suggestion.referenced_sentence,
        citation: {
          id: libraryDoc[0].id,
          citations: citations,
          href: metadata.url,
        },
      });
    }
  }

  console.log("Returning ai sentence");

  return NextResponse.json({
    text: suggestion.ai_sentence,
    citation: null,
  });
}
