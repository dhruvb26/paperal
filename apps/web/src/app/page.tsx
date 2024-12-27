"use client";

import { CustomUploadDropzone } from "@/components/uploadthing/custom-upload-dropzone";
import { useState } from "react";

export default function Home() {
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12">
      <h1 className="text-sm">Hey there user!</h1>
    </main>
  );
}
