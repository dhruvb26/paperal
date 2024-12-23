import { create } from "zustand";

interface NodeData {
  label: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: string;
}

export interface FlowNode {
  id: string;
  position: {
    x: number;
    y: number;
  };
  data: NodeData;
  type: string;
  selected: boolean;
}

interface EdgeData {
  sourceNode: FlowNode;
  targetNode: FlowNode;
}

interface SidebarState {
  isRightSidebarOpen: boolean;
  edgeData: EdgeData | null;
  toggleRightSidebar: () => void;
  setEdgeData: (data: EdgeData) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isRightSidebarOpen: false,
  edgeData: null,
  toggleRightSidebar: () =>
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  setEdgeData: (data) => set({ edgeData: data }),
  updateNodeLabel: (nodeId: string, label: string) =>
    set((state) => ({
      edgeData: state.edgeData
        ? {
            sourceNode:
              state.edgeData.sourceNode.id === nodeId
                ? {
                    ...state.edgeData.sourceNode,
                    data: { ...state.edgeData.sourceNode.data, label },
                  }
                : state.edgeData.sourceNode,
            targetNode:
              state.edgeData.targetNode.id === nodeId
                ? {
                    ...state.edgeData.targetNode,
                    data: { ...state.edgeData.targetNode.data, label },
                  }
                : state.edgeData.targetNode,
          }
        : null,
    })),
}));
