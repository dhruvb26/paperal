"use client";

import React from "react";
import { UploadDropzone } from "@/utils/uploadthing";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BoxArrowUp } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";

export const CustomUploadDropzone = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 shadow-none">
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 border-none" hideCloseButton>
        <UploadDropzone
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
          content={{
            uploadIcon() {
              return (
                <BoxArrowUp
                  className="text-accent-foreground"
                  size={44}
                  weight="duotone"
                />
              );
            },
            allowedContent() {
              return "PDF file upto 8MB";
            },
          }}
          appearance={{
            container({ isDragActive }) {
              return {
                backgroundColor: "#ffffff",
                ...(isDragActive && {
                  backgroundColor: "#f0f0f0",
                }),
              };
            },
          }}
          className="bg-background ut-button:h-8 ut-button:gap-2 mt-0 ut-allowed-content:text-muted-foreground ut-label:text-accent-foreground ut-label:font-medium ut-button:bg-primary ut-button:ut-uploading:bg-primary ut-button:ut-uploading:after:bg-primary/50 ut-button:text-xs ut-button:font-normal ut-button:px-3 ut-button:py-2 ut-button:focus-visible:outline-none ut-button:outline-none ut-button:ring-0 ut-button:focus:ring-0"
          endpoint="pdfUploader"
        />
      </DialogContent>
    </Dialog>
  );
};
