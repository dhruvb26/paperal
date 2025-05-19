'use client'
import React, { useCallback, useState, useRef } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
} from '@xyflow/react'
import CustomNode from '@/components/flow/custom-node'
import NodeEditor from '@/components/flow/node-editor'
import '@xyflow/react/dist/style.css'
import { AnimatedEdge } from '@/components/flow/animated-edge'
import { Button } from '@/components/ui/button'
import { CustomEdge } from '@/components/flow/custom-edge'
import { useSidebarStore } from '@/stores/sidebar-store'
import { Chats } from '@phosphor-icons/react'
import dagre from '@dagrejs/dagre'

const edgeTypes = {
  animatedSvg: AnimatedEdge,
  customEdge: CustomEdge,
}
const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 150 },
    data: {
      title: 'Purpose of Computing',
      label: `<h3><span style="color: black">The purpose of computing is insight, not numbers. </span><span style="color: #DAA520">To discover insights from a system, we need to first model the system.</span></h3>
      <ul>
        <li>Real-world systems may be more complex, but they all share the same general anatomy: an <span style="color: #DAA520">independent variable</span> (such as time), a <span style="color: #DAA520">structure</span> (such as an algorithm), and a <span style="color: #DAA520">dataset</span> (such as an environment).</li>
        <li>For many systems, that <span style="color: #DAA520">input data comes from some sort of environment</span>.</li>
      </ul>
      `,
    },
    type: 'custom',
    selected: false,
  },
  {
    id: '2',
    position: { x: 250, y: 500 },
    data: {
      title: 'Introduction',
      label: 'Node 2',
    },
    type: 'custom',
    selected: false,
  },
]

const nodeTypes = {
  custom: CustomNode,
}
const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'customEdge',
    data: {
      sourceNode: initialNodes[0],
      targetNode: initialNodes[1],
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'customEdge',
    data: {
      sourceNode: initialNodes[1],
      targetNode: initialNodes[2],
    },
  },
]

let id = 3
const getId = () => `${id++}`

// Adjust these constants for larger nodes and more spacing
const nodeWidth = 500 // Increased from 172
const nodeHeight = 200 // Increased from 36
const PADDING = 100 // Add padding between nodes

// Add the layout utility function before the Flow component
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100, // Minimum horizontal separation between nodes
    ranksep: 150, // Minimum vertical separation between nodes
    edgesep: 50, // Minimum edge separation
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

function Flow() {
  const reactFlowWrapper = useRef(null)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const toggleRightSidebar = useSidebarStore(
    (state) => state.toggleRightSidebar
  )

  const onConnect = useCallback(
    (params: any) => {
      const sourceNode = nodes.find((node) => node.id === params.source)
      const targetNode = nodes.find((node) => node.id === params.target)

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'customEdge',
            data: {
              sourceNode,
              targetNode,
            },
          },
          eds
        )
      )
    },
    [setEdges, nodes]
  )

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.id)
  }, [])

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
          }
        }
        return node
      })
    )
  }

  const onConnectEnd = useCallback(
    (event: any, connectionState: any) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event

        const id = getId()
        const newNode = {
          id,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: {
            title: '',
            label: `Node ${id}`,
          },
          type: 'custom',
          selected: false,
        }

        setNodes((nds) => nds.concat(newNode))
        setEdges((eds) =>
          eds.concat({
            id,
            source: connectionState.fromNode.id,
            target: id,
            type: 'customEdge',
            data: {
              sourceNode: connectionState.fromNode,
              targetNode: newNode,
            },
          })
        )
      }
    },
    [screenToFlowPosition]
  )

  // Add layout function
  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction)
      setNodes([...layoutedNodes])
      setEdges([...layoutedEdges])

      // Adjust the fitView parameters
      window.requestAnimationFrame(() =>
        fitView({
          padding: PADDING,
          maxZoom: 1.5, // Limit maximum zoom
          minZoom: 0.5, // Limit minimum zoom
          duration: 500, // Animation duration in ms
        })
      )
    },
    [nodes, edges, fitView]
  )

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <Button variant="outline" onClick={() => onLayout('TB')}>
          Vertical Layout
        </Button>
        <Button variant="outline" onClick={() => onLayout('LR')}>
          Horizontal Layout
        </Button>
        <Button
          variant="outline"
          onClick={toggleRightSidebar}
          className="font-normal"
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
        style={{ backgroundColor: 'transparent' }}
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
  )
}

export default function Playground() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}
