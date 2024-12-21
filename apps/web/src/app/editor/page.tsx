"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createDocument, getDocuments } from "./actions";
import { renderDate } from "@/utils/render-date";
import { UploadButton } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string | null;
  content: any;
  createdAt: Date | null;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    getDocuments().then((docs) => {
      setDocuments(docs);
    });
  }, []);

  const createNewDocument = async () => {
    const newDocId = await createDocument();
    router.push(`/editor/${newDocId}`);
  };

  const openDocument = (docId: string) => {
    router.push(`/editor/${docId}`);
  };

  return (
    <div className="flex flex-col items-start justify-start h-screen p-12 w-full">
      <div className="items-end justify-between pt-8 flex flex-row gap-2 w-full">
        <h1 className="text-xl font-semibold">Your Documents</h1>
        <Button onClick={createNewDocument}>New Document</Button>
        <UploadButton
          endpoint="pdfUploader"
          onClientUploadComplete={(res) => {
            toast({
              title: "Upload Completed",
              description: "Your file has been uploaded successfully",
            });
          }}
          onUploadError={(error: Error) => {
            toast({
              title: "Error",
              description: error.message,
            });
          }}
        />
      </div>

      <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="text-center text-muted-foreground col-span-full">
            No documents yet. Create one to get started!
          </div>
        ) : (
          documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors rounded-md shadow-none"
              onClick={() => openDocument(doc.id ?? "")}
            >
              <CardHeader>
                <CardTitle>
                  {(() => {
                    try {
                      const content =
                        typeof doc.content === "string"
                          ? JSON.parse(doc.content)
                          : doc.content;

                      const firstHeading = content.content.find(
                        (node: any) => node.type === "heading"
                      );

                      return (
                        firstHeading?.content?.[0]?.text || "Untitled Document"
                      );
                    } catch (error) {
                      console.error("Error parsing document:", error);
                      return "Untitled Document";
                    }
                  })()}
                </CardTitle>
                <CardDescription>
                  {renderDate(doc.createdAt ?? new Date())}
                </CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
