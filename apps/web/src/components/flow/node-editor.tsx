"use client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyIcon, Settings2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebarStore } from "@/store/sidebar-store";

interface NodeEditorProps {
  selectedNode: string;
  nodes: any[];
  updateNodeData: (nodeId: string, newData: any) => void;
}

const remToPx = (rem: string) => {
  const baseSize = 16; // Browser default font size
  return `${parseFloat(rem) * baseSize}px`;
};

const pxToRem = (px: string) => {
  const baseSize = 16;
  return `${parseFloat(px) / baseSize}rem`;
};

const fontSizes = ["8px", "12px", "16px", "20px", "24px", "32px"];

export default function NodeEditor({
  selectedNode,
  nodes,
  updateNodeData,
}: NodeEditorProps) {
  const selectedNodeData = nodes.find((n) => n.id === selectedNode)?.data;
  const { toast } = useToast();
  const { updateNodeLabel } = useSidebarStore();

  const handleLabelChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newLabel = e.target.value;
    updateNodeData(selectedNode, { label: newLabel });
    updateNodeLabel(selectedNode, newLabel);
  };

  return (
    <div className="absolute top-4 right-4 bg-none  rounded-md min-w-[300px]">
      <div className="space-y-2">
        <div className="flex flex-col gap-2">
          <Textarea
            value={selectedNodeData?.label || ""}
            onChange={handleLabelChange}
            className="w-full px-2 py-1 border rounded h-40 text-xs bg-background"
            style={{ fontSize: "0.75rem" }}
            placeholder="Enter your text here"
          />
          <div className="flex justify-end gap-2">
            <DropdownMenu>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Settings2Icon className="w-2 h-2" />
                        </Button>
                      </DropdownMenuTrigger>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Customize</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent className="w-[300px]" side="left">
                <div className="space-y-4 p-2">
                  {/* <div className="flex flex-col gap-2">
                    <Label className="text-xs font-normal">Font Size</Label>
                    <Select
                      value={
                        selectedNodeData?.fontSize
                          ? remToPx(selectedNodeData.fontSize)
                          : "8px"
                      }
                      onValueChange={(value) =>
                        updateNodeData(selectedNode, {
                          fontSize: pxToRem(value),
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-normal">Node</Label>
                    <div className="flex flex-row gap-2">
                      <ColorPicker
                        value={selectedNodeData?.backgroundColor || "#ffffff"}
                        onChange={(color) =>
                          updateNodeData(selectedNode, {
                            backgroundColor: color,
                          })
                        }
                      />
                      <ColorPicker
                        value={selectedNodeData?.borderColor || "#000000"}
                        onChange={(color) =>
                          updateNodeData(selectedNode, {
                            borderColor: color,
                          })
                        }
                      />
                    </div>
                  </div>
                  {/* <div className="flex flex-col gap-2">
                    <Label className="text-xs font-normal">Text</Label>
                    <ColorPicker
                      value={selectedNodeData?.textColor || "#000000"}
                      onChange={(color) =>
                        updateNodeData(selectedNode, {
                          textColor: color,
                        })
                      }
                    />
                  </div> */}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="icon"
                      onClick={() => {
                        if (selectedNodeData?.label) {
                          navigator.clipboard.writeText(selectedNodeData.label);
                          toast({
                            description:
                              "The text has been copied to your clipboard.",
                          });
                        }
                      }}
                    >
                      <CopyIcon className="w-2 h-2" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Copy</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
