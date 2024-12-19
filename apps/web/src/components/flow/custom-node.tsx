"use client";
import { Handle, Position, NodeResizer } from "@xyflow/react";

import React from "react";

const CustomNode = ({
  data,
  selected,
}: {
  data: {
    label: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    fontSize?: string;
  };
  selected?: boolean;
}) => {
  return (
    <>
      <NodeResizer
        color="rgba(0, 0, 0, 0.5)"
        isVisible={selected}
        minWidth={100}
        minHeight={30}
      />
      <div
        className="px-2 py-2 rounded-md border-[0.8px]"
        style={{
          backgroundColor: data.backgroundColor,
          borderColor: data.borderColor,
          color: data.textColor,
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
