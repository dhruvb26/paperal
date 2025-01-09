"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  List,
} from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs, Outline } from "react-pdf";
import { useSidebar } from "@/components/ui/sidebar";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { getLibrary } from "@/app/actions/library";
import useSWR from "swr";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const VisualPage = () => {
  const params = useParams<{ id: string }>();
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1.0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const { open: isSidebarOpen } = useSidebar();
  const [selectedText, setSelectedText] = useState<string>("");
  const [annotations, setAnnotations] = useState<any[]>([]);

  const { data, isLoading } = useSWR(params.id ? params.id : null, getLibrary);

  const url = data?.[0]?.metadata?.fileUrl;

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
    setScale((prevScale) => Math.min(prevScale + 0.1, 1.4));
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <div className="flex-1 overflow-y-auto flex justify-start max-w-fit relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
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
              file={url}
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
          file={url}
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
                className="mb-4 shadow"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={handlePageLoadSuccess}
              />
            </div>
          ))}
        </Document>
      </div>

      <div className="border-l bg-background p-4 max-w-64">
        <p className="text-sm">{selectedText}</p>
        <div className="mt-4 max-h-[80vh] overflow-y-auto">
          <h3 className="font-medium">Annotations:</h3>
          {annotations.map((annotation, index) => (
            <div key={index} className="text-sm mt-2">
              <p>Type: {annotation.subtype}</p>
              <p>Page: {annotation.pageIndex + 1}</p>
              <p>Rect: {JSON.stringify(annotation.rect)}</p>
              {annotation.contents && <p>Content: {annotation.contents}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisualPage;
