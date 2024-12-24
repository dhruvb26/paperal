"use client";
import { Handle, Position, NodeResizer } from "@xyflow/react";

import React from "react";

const CustomNode = ({
  data,
  selected,
}: {
  data: {
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
    <>
      <NodeResizer
        color="rgba(0, 0, 0, 0.5)"
        isVisible={selected}
        minWidth={divRef.current?.offsetWidth || 100}
        minHeight={divRef.current?.offsetHeight || 30}
      />
      <div
        ref={divRef}
        className="px-2 py-2 rounded-md border-[0.8px]"
        style={{
          backgroundColor: data.backgroundColor || "#ffffff",
          borderColor: data.borderColor || "hsl(var(--border))",
          color: data.textColor || "#000000",
          width: "100%",
          height: "100%",
        }}
      >
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <div className="flex items-center">
          <div
            className="w-full whitespace-pre-wrap break-words"
            style={{ fontSize: data.fontSize || "0.5rem" }}
          >
            {data.label}
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>
    </>
  );
};

export default CustomNode;
