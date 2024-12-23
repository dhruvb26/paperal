"use client";

import { UploadButton } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { twMerge } from "tailwind-merge";

export const CustomUploadButton = () => {
  const { toast } = useToast();

  return (
    <UploadButton
      config={{ cn: twMerge }}
      className="ut-button:bg-primary ut-button:ut-uploading:bg-primary/90 ut-button:ut-uploading:after:bg-primary/90 ut-button:text-sm ut-button:font-normal ut-button:h-9 ut-button:px-4 ut-button:py-2 ut-button:focus-visible:outline-none ut-button:outline-none ut-button:ring-0 ut-button:focus:ring-0 ut-allowed-content:hidden"
      endpoint="pdfUploader"
      onClientUploadComplete={(res) => {
        toast({
          title: "Upload Complete",
          description: "File uploaded successfully.",
        });
      }}
      onUploadError={(error) => {
        toast({
          title: "Upload Error",
          description: error.message,
        });
      }}
    />
  );
};
