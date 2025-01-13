"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  List,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs, Outline } from "react-pdf";
import { useSidebar } from "@/components/ui/sidebar";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { getLibrary } from "@/app/actions/library";
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const VisualPage = () => {
  const params = useParams<{ id: string }>();
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1.4);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { user, isLoaded } = useUser();
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const { open: isSidebarOpen } = useSidebar();
  const [selectedText, setSelectedText] = useState<string>("");
  const [annotations, setAnnotations] = useState<any[]>([]);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setInput,
  } = useChat({
    body: {
      userId: user?.id,
      threadId: "d8b3c1a2-f5e7-4f9d-b6c8-a9e2d4f3b5c8",
    },
    onResponse: (response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
    },
  });
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { data, isLoading: isPageLoading } = useSWR(
    params.id ? params.id : null,
    getLibrary
  );

  // const url = data?.[0]?.metadata?.fileUrl;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
  };

  const scrollToPage = (pageNumber: number) => {
    const pageRef = pageRefs.current[pageNumber - 1];
    if (pageRef) {
      pageRef.scrollIntoView({ behavior: "smooth" });
    }
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 1.6));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 1.1));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const text = selection.toString();
      if (text) {
        setSelectedText(text);
        setInput(text);
      }
    }
  };

  const handlePageLoadSuccess = async (page: any) => {
    try {
      const annotations = await page.getAnnotations();
      setAnnotations((prevAnnotations) => [...prevAnnotations, ...annotations]);
    } catch (error) {
      console.error("Error loading annotations:", error);
    }
  };

  React.useEffect(() => {
    if (isSidebarOpen) {
      setIsOutlineOpen(false);
    }
  }, [isSidebarOpen]);

  if (isPageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="overflow-y-auto overflow-x-hidden flex-shrink-0">
        <div className="sticky top-4 left-4 z-50 flex gap-2 ml-4">
          <Button
            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
            variant="secondary"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
          >
            <List size={20} />
          </Button>
          <Button
            onClick={zoomOut}
            variant="secondary"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
          >
            <MagnifyingGlassMinus size={16} />
          </Button>
          <Button
            onClick={zoomIn}
            variant="secondary"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
          >
            <MagnifyingGlassPlus size={16} />
          </Button>
        </div>

        {isOutlineOpen && (
          <div className="absolute z-20 top-16 left-4 w-64 max-h-[80vh] overflow-y-auto bg-background border rounded-md">
            <Document
              file={"some"}
              className="[&_a]:block [&_a]:py-1.5 text-foreground p-2 text-sm outline-container"
              loading={<Loader />}
              onItemClick={({ pageNumber }) => {
                scrollToPage(pageNumber);
                setIsOutlineOpen(true);
              }}
            >
              <Outline className="p-4 px-6" />
            </Document>
          </div>
        )}

        <Document
          file={"some"}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={""}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => {
                pageRefs.current[index] = el;
              }}
              onMouseUp={handleTextSelection}
            >
              <Page
                pageNumber={index + 1}
                scale={scale}
                className="mb-4"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={handlePageLoadSuccess}
              />
            </div>
          ))}
        </Document>
      </div>
      <div className="flex flex-col flex-1 min-w-[300px] overflow-hidden border-l">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex text-xs ${
                message.role === "user"
                  ? "justify-end text-right"
                  : "justify-start text-left"
              }`}
            >
              <div
                className={`max-w-[80%] break-words overflow-wrap-anywhere px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-t-2xl rounded-l-2xl rounded-br"
                    : "bg-muted text-foreground rounded-t-2xl rounded-r-2xl rounded-bl"
                }`}
              >
                <ReactMarkdown className="overflow-hidden [&_p]:mb-4 last:[&_p]:mb-0">
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-end justify-center flex-row gap-2 p-4 border-t"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder=""
            style={{
              fontSize: "12px",
            }}
            disabled={isLoading}
            className="text-xs placeholder:text-xs  py-1 px-3"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          {isLoading ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8"
              onClick={() => stop()}
            >
              <Loader className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size={"icon"}
              className="h-8"
              variant={"ghost"}
            >
              <PaperPlaneRight size={16} />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default VisualPage;
