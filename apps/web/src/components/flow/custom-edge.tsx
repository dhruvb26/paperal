import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";
import { Button } from "@/components/ui/button";

export function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
  source,
  target,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleExplainClick = () => {
    // Find the connected nodes and log their text
    const sourceNode = data?.sourceNode;
    const targetNode = data?.targetNode;
  };

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
      <foreignObject
        width={150}
        height={32}
        x={labelX - 50}
        y={labelY - 20}
        className="edge-button-foreignObject"
      >
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleExplainClick();
          }}
          size="sm"
          className="bg-white text-black border text-xs hover:bg-gray-100"
        >
          Explain with AI
        </Button>
      </foreignObject>
    </>
  );
}
