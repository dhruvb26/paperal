"use client";
import React, { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  Panel,
} from "@xyflow/react";
import CustomNode from "@/components/flow/custom-node";
import NodeEditor from "@/components/flow/node-editor";
import "@xyflow/react/dist/style.css";
import { AnimatedEdge } from "@/components/flow/animated-edge";
import Dagre from "@dagrejs/dagre";
import { Button } from "@/components/ui/button";
import { StretchHorizontal, StretchVertical } from "lucide-react";
import { CustomEdge } from "@/components/flow/custom-edge";

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
      backgroundColor: "#ffffff",
      borderColor: "#000000",
      textColor: "#000000",
    },
    fontSize: "0.5rem",
    type: "custom",
    selected: false,
  },
  {
    id: "2",
    position: { x: 100, y: 100 },
    data: {
      label: "This paper talks about applications of AI in the future",
      backgroundColor: "#ffffff",
      borderColor: "#000000",
      textColor: "#000000",
      fontSize: "0.5rem",
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
            backgroundColor: "#ffffff",
            borderColor: "#000000",
            textColor: "#000000",
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

  const getLayoutedElements = (
    nodes: any[],
    edges: any[],
    direction: "TB" | "LR"
  ) => {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: direction,
    });

    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node) => g.setNode(node.id, { width: 100, height: 50 }));

    Dagre.layout(g);

    return {
      nodes: nodes.map((node) => {
        const position = g.node(node.id);
        return {
          ...node,
          position: {
            x: position.x,
            y: position.y,
          },
        };
      }),
      edges,
    };
  };

  const onLayout = useCallback(
    (direction: "TB" | "LR") => {
      const layouted = getLayoutedElements(nodes, edges, direction);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
    },
    [nodes, edges]
  );

  return (
    <div className="w-full h-screen relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        attributionPosition="bottom-left"
        connectionMode={ConnectionMode.Loose}
        onConnectEnd={onConnectEnd}
        edgeTypes={edgeTypes}
      >
        <Controls />
        <MiniMap />
        {/* @ts-ignore */}
        <Background gap={12} size={1} variant="none" />
        <Panel position="top-left" className="flex flex-col gap-2">
          <Button onClick={() => onLayout("TB")} size="icon">
            <StretchHorizontal />
          </Button>
          <Button onClick={() => onLayout("LR")} size="icon">
            <StretchVertical />
          </Button>
        </Panel>
      </ReactFlow>

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
