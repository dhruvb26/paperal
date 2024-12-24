"use client";
import React, { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
} from "@xyflow/react";
import CustomNode from "@/components/flow/custom-node";
import NodeEditor from "@/components/flow/node-editor";
import "@xyflow/react/dist/style.css";
import { AnimatedEdge } from "@/components/flow/animated-edge";
import { Button } from "@/components/ui/button";
import { CustomEdge } from "@/components/flow/custom-edge";
import { useSidebarStore } from "@/store/sidebar-store";
import { Chats } from "@phosphor-icons/react";

const edgeTypes = {
  animatedSvg: AnimatedEdge,
  customEdge: CustomEdge,
};
const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 50 },
    data: {
      label: "Abstract",
    },
    type: "custom",
    selected: false,
  },
  {
    id: "2",
    position: { x: 100, y: 100 },
    data: {
      label: "This paper talks about applications of AI in the future",
    },
    type: "custom",
    selected: false,
  },
];

const nodeTypes = {
  custom: CustomNode,
};
const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "customEdge",
    data: {
      sourceNode: initialNodes[0],
      targetNode: initialNodes[1],
    },
  },
];

let id = 3;
const getId = () => `${id++}`;

function Flow() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const toggleRightSidebar = useSidebarStore(
    (state) => state.toggleRightSidebar
  );

  const onConnect = useCallback(
    (params: any) => {
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "customEdge",
            data: {
              sourceNode,
              targetNode,
            },
          },
          eds
        )
      );
    },
    [setEdges, nodes]
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.id);
  }, []);

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      })
    );
  };

  const onConnectEnd = useCallback(
    (event: any, connectionState: any) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;

        const id = getId();
        const newNode = {
          id,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: {
            label: `Node ${id}`,
          },
          type: "custom",
          fontSize: "0.5rem",
          selected: false,
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) =>
          eds.concat({
            id,
            source: connectionState.fromNode.id,
            target: id,
            type: "customEdge",
            data: {
              sourceNode: connectionState.fromNode,
              targetNode: newNode,
            },
          })
        );
      }
    },
    [screenToFlowPosition]
  );

  return (
    <div className="w-full h-screen relative" ref={reactFlowWrapper}>
      <div className="absolute bottom-16 right-4 z-10">
        <Button
          variant="outline"
          onClick={toggleRightSidebar}
          className="bg-white font-normal"
        >
          <Chats size={16} />
          Chat
        </Button>
      </div>
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        onConnectEnd={onConnectEnd}
        edgeTypes={edgeTypes}
        style={{ backgroundColor: "transparent" }}
      ></ReactFlow>

      {selectedNode && (
        <>
          <NodeEditor
            selectedNode={selectedNode}
            nodes={nodes}
            updateNodeData={updateNodeData}
          />
        </>
      )}
    </div>
  );
}

export default function Playground() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
