"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
  onLibraryClick,
  onEditorClick,
}: {
  items: {
    title: string;
    url: string;
    icon: React.ReactNode;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  onLibraryClick: () => void;
  onEditorClick: () => void;
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={{
                children: item.title,
                hidden: false,
              }}
              isActive={item.isActive}
              asChild
            >
              {item.title === "Library" ? (
                <button onClick={onLibraryClick}>{item.icon}</button>
              ) : item.title === "Documents" ? (
                <button onClick={onEditorClick}>{item.icon}</button>
              ) : (
                <Link href={item.url}>{item.icon}</Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
