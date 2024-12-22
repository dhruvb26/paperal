"use client";

import { useParams } from "next/navigation";
import { getDocument } from "@/app/actions/documents";
import { useEffect, useState } from "react";
import Tiptap from "@/components/editor/tip-tap";
import { Loader } from "@/components/ui/loader";
type Document = {
  content: unknown;
  id: string;
  createdAt: Date;
  updatedAt: Date | null;
  userId: string | null;
};

export default function EditorPage() {
  const params = useParams();
  const documentId = params.page;
  const [document, setDocument] = useState<Document[] | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      const doc = await getDocument(documentId as string);
      setDocument(doc);
    };
    fetchDocument();
  }, [documentId]);

  return (
    <div className="flex flex-col items-start justify-center p-40">
      {!document ? (
        <div className="w-full h-[200px] flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <Tiptap
          documentId={documentId as string}
          initialContent={document[0].content}
        />
      )}
    </div>
  );
}
