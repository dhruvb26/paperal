"use client";
import * as React from "react";
import { useSidebarStore } from "@/store/sidebar-store";
import { Textarea } from "@/components/ui/textarea";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { isRightSidebarOpen, edgeData } = useSidebarStore();

  return (
    <Sidebar
      collapsible="none"
      className={`sticky hidden text-center lg:flex top-0 h-svh ${
        isRightSidebarOpen ? "border-l transition-all" : ""
      }`}
      open={isRightSidebarOpen}
      {...props}
    >
      <SidebarHeader className="p-4">
        <h2 className="text-base font-medium">Chat with your graph</h2>
      </SidebarHeader>
      <SidebarContent className="p-6">
        <span className="text-sm text-muted-foreground">
          Ask questions about your graph and get answers coming soon.
        </span>

        {/* <div className="space-y-4">
          <div>
            <label className="text-sm ">Source Node</label>
            <Textarea
              value={edgeData?.sourceNode?.data?.label || ""}
              readOnly
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm ">Target Node</label>
            <Textarea
              value={edgeData?.targetNode?.data?.label || ""}
              readOnly
              className="mt-1"
            />
          </div>
        </div> */}
      </SidebarContent>
    </Sidebar>
  );
}
