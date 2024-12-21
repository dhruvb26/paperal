"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const Tiptap = dynamic(() => import("@/components/editor/tip-tap"), {
  ssr: false,
});

export default function EditorPage() {
  const params = useParams();
  const documentId = params.page;

  return (
    <div className="p-12">
      <Tiptap documentId={documentId as string} />
    </div>
  );
}
