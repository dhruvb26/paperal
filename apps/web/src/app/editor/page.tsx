"use client";

import Tiptap from "@/components/editor/tip-tap";
import { UploadButton } from "@/utils/uploadthing";

export default function Home() {
  return (
    <div className="flex flex-col items-start justify-start h-screen p-4 py-12r">
      <Tiptap />
      {/* <UploadButton
        endpoint="pdfUploader"
        onClientUploadComplete={async (res) => {
          // Do something with the response
          console.log("Files: ", res);
          alert("Upload Completed");

          await fetch("/api/langchain/pdf-loader", {
            method: "POST",
            body: JSON.stringify({ pdfUrl: res[0].url }),
          });
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          alert(`ERROR! ${error.message}`);
        }}
      /> */}
    </div>
  );
}
