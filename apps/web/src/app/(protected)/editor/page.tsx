"use client";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { CustomUploadButton } from "@/components/uploadthing/custom-upload-button";

const EditorHomePage = () => {
  const { toast } = useToast();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-2">
      <p className="text-sm">Hey this is the editor.</p>
      <CustomUploadButton />
    </div>
  );
};

export default EditorHomePage;
