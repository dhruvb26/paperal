"use client";

import { UploadButton } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { twMerge } from "tailwind-merge";
import { Loader } from "../ui/loader";
import { Plus } from "@phosphor-icons/react";
import { useLoadingToast } from "@/hooks/use-loading-toast";
import { Spinner } from "@phosphor-icons/react";

export const CustomUploadButton = () => {
  const { toast } = useToast();
  const { startLoadingToast } = useLoadingToast();

  return (
    <>
      <UploadButton
        content={{
          button: ({ ready }) => {
            if (ready)
              return (
                <div className="flex items-center text-foreground">
                  <Plus weight="light" />
                </div>
              );
            return (
              <div>
                <Loader />
              </div>
            );
          },
        }}
        config={{ cn: twMerge }}
        className="ut-button:bg-background ut-button:border ut-button:border-input ut-button:hover:bg-accent ut-button:w-8 ut-button:h-8 ut-button:ut-uploading:bg-accent ut-button:ut-uploading:after:bg-accent/50 ut-button:text-sm ut-button:font-normal ut-button:px-4 ut-button:py-1 ut-button:outline-none ut-button:ring-0 ut-button:focus:ring-0 ut-allowed-content:hidden ut-button:focus-visible:ring-0"
        endpoint="pdfUploader"
        onUploadBegin={() => {
          startLoadingToast({
            id: "upload-started",
            message: "Upload Started",
            description: "Your file is being uploaded.",
            duration: Infinity,
          });
        }}
        onClientUploadComplete={(res) => {
          toast({
            id: "upload-complete",
            title: "Upload Complete",
            description: "File uploaded successfully.",
            variant: "success",
          });
        }}
        onUploadError={(error) => {
          toast({
            title: "Upload Error",
            description: error.message,
            variant: "destructive",
          });
        }}
      />
    </>
  );
};
