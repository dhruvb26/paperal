"use client";

import { UploadButton } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { twMerge } from "tailwind-merge";
import { Loader } from "../ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Plus } from "@phosphor-icons/react";

export const CustomUploadButton = () => {
  const { toast } = useToast();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          <UploadButton
            content={{
              button: ({ ready }) => {
                if (ready)
                  return (
                    <div className="flex items-center text-foreground gap-2">
                      <Plus />
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
            className="ut-button:bg-background ut-button:border ut-button:border-input ut-button:hover:bg-accent ut-button:w-9 ut-button:h-8 ut-button:ut-uploading:bg-accent ut-button:ut-uploading:after:bg-accent/50 ut-button:text-sm ut-button:font-normal ut-button:px-4 ut-button:py-1 ut-button:focus-visible:outline-none ut-button:outline-none ut-button:ring-0 ut-button:focus:ring-0 ut-allowed-content:hidden"
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
        </TooltipTrigger>
        <TooltipContent side="right">Upload</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
