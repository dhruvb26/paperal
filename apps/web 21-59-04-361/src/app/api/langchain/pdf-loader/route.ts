import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export async function POST(req: Request) {
  console.log("PDF Loader");
  const { pdfUrl } = (await req.json()) as { pdfUrl: string };

  // Fetch the PDF from the URL
  const response = await fetch(pdfUrl);
  const pdfBlob = await response.blob();

  const loader = new WebPDFLoader(pdfBlob, {
    parsedItemSeparator: "",
    splitPages: false,
  });

  const docs = await loader.load();

  const content = docs[0].pageContent.split("\n").join("\n");

  console.log(content);

  return NextResponse.json({ content }, { status: 200 });
}
