import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export const SidebarSkeleton = () => {
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
    >
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r group-data-[collapsible=icon]:border-r-0 transition-all duration-300"
      >
        <SidebarContent className="p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
        </SidebarContent>
        <SidebarFooter className="p-2">
          <Skeleton className="h-8 w-8 rounded-md" />
        </SidebarFooter>
      </Sidebar>

      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="border-b p-2">
          <Skeleton className="h-8 w-full rounded-md" />
        </SidebarHeader>

        <SidebarHeader className="border-b p-2 flex justify-between">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </SidebarHeader>

        <SidebarContent className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
};

export default SidebarSkeleton;
