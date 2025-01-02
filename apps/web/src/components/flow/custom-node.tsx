"use client";
import { Handle, Position } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import React from "react";

const CustomNode = ({
  data,
  selected,
}: {
  data: {
    title?: string;
    label: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    fontSize?: string;
  };
  selected?: boolean;
}) => {
  const divRef = React.useRef<HTMLDivElement>(null);

  return (
    <div style={{ minHeight: "30px" }} className="max-w-xl">
      <div
        ref={divRef}
        className="px-2 py-2 rounded-md border-[0.8px]"
        style={{
          backgroundColor: data.backgroundColor || "#ffffff",
          borderColor: data.borderColor || "#000000",
          color: data.textColor || "#000000",
          width: "100%",
          minHeight: "inherit",
        }}
      >
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <div className="flex items-center">
          <div
            className="w-full whitespace-pre-wrap break-words flex flex-col gap-2"
            style={{ fontSize: data.fontSize || "0.5rem" }}
          >
            {data.title && (
              <span
                className="font-semibold"
                style={{ fontSize: data.fontSize || "0.5rem" }}
              >
                {data.title}
              </span>
            )}
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Clicked link:", props.href);
                    }}
                    className="text-blue-500 hover:underline"
                  />
                ),
              }}
            >
              {data.label}
            </ReactMarkdown>
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>
    </div>
  );
};

export default CustomNode;
