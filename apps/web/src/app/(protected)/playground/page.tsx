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
      label: "Introduction",
    },
    type: "custom",
    selected: false,
  },
  {
    id: "2",
    position: { x: 250, y: 150 },
    data: {
      label:
        "Training of large language models (LLMs) on large scrapes of the web [Gem, Ope] has recently raised significant privacy concerns [Rahman and Santacana, 2023, Wu et al., 2023]. The inclusion of personally identifiable information (PII) and copyrighted material in the training corpora has led to legal challenges, notably the lawsuit between The New York Times and OpenAI [Gry, 2023], among others [Bak, 2023, Sil, 2023]. Such cases highlight the issue of using copyrighted content without attribution and/or license. Potentially, they undermine the rights of creators and disincentivize future artistic endeavors due to the lack of monetary compensation for works freely accessible online. This backdrop sets the stage for the technical challenge of identifying training data within machine learning models [Maini et al., 2021, Shokri et al., 2017]. Despite legal ambiguities, the task holds critical importance for understanding LLMs' operations and ensuring data accountability.",
    },
    type: "custom",
    selected: false,
  },
  {
    id: "3",
    position: { x: 250, y: 300 },
    data: {
      label: `References:
• Germini, https://gemini.google.com/. URL https://gemini.google.com/.
• Noorjahan Rahman and Eduardo Santacana. Beyond fair use: Legal risk evaluation for training llms on copyrighted text. 2023.
• The times sues openai and microsoft over a.i. use of copyrighted work https://www.nytimes.com/2023/12/27/business/media/new-york-times-open-ai-microsoft-lawsuit.html. 2023.
• Getty images vs. stability ai: A landmark case in copyright and ai, 2023.
• Sarah silverman and authors sue openai and meta over copyright infringement. 2023.
• Pratyush Maini, Mohammad Yaghini, and Nicolas Papernot. Dataset inference: Ownership resolution in machine learning. In International Conference on Learning Representations, 2021.
• R. Shokri, M. Stronati, C. Song, and V. Shmatikov. Membership inference attacks against machine learning models. In 2017 IEEE Symposium on Security and Privacy (SP), pages 3–18, Los Alamitos, CA, USA, may 2017. IEEE Computer Society.`,
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
  {
    id: "e2-3",
    source: "2",
    target: "3",
    type: "customEdge",
    data: {
      sourceNode: initialNodes[1],
      targetNode: initialNodes[2],
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
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <div className="absolute bottom-4 right-4 z-10">
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
