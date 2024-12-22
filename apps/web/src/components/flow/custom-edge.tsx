import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";
import { useSidebarStore } from "@/store/sidebar-store";
import { FlowNode } from "@/store/sidebar-store";

interface CustomEdgeProps extends EdgeProps {
  data: {
    sourceNode: FlowNode;
    targetNode: FlowNode;
  };
}

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
}: CustomEdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { toggleRightSidebar, setEdgeData, isRightSidebarOpen } =
    useSidebarStore();

  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdgeData({
      sourceNode: data?.sourceNode,
      targetNode: data?.targetNode,
    });
    if (!isRightSidebarOpen) {
      toggleRightSidebar();
    }
  };

  return (
    <g onClick={handleEdgeClick}>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
    </g>
  );
}
