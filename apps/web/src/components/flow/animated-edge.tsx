import React from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <path
        d="M -5 -4 L 5 0 L -5 4 Z"
        fill="#0000ff"
        transform="translate(10, 0)"
      >
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={edgePath}
          rotate="auto"
        />
      </path>
    </>
  );
}
