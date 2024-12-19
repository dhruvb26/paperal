"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  GearSix,
  TerminalWindow,
  Lifebuoy,
  FadersHorizontal,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import Image from "next/image";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: <TerminalWindow size={24} />,
      isActive: true,
      items: [
        {
          title: "Editor",
          url: "/editor",
        },
        {
          title: "History",
          url: "/editor/history",
        },
        {
          title: "Settings",
          url: "/editor/settings",
        },
      ],
    },
    {
      title: "Models",
      url: "/models",
      icon: <FadersHorizontal size={24} />,
      items: [
        {
          title: "Explorer",
          url: "/models/explorer",
        },
        {
          title: "Trace",
          url: "/models/trace",
        },
      ],
    },

    {
      title: "Settings",
      url: "/settings",
      icon: <GearSix size={24} />,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },

        {
          title: "Billing",
          url: "/settings/billing",
        },
        {
          title: "Limits",
          url: "/settings/limits",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: <Lifebuoy size={24} />,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: <PaperPlaneTilt size={24} />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      {/* <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="bg-sidebar-background hover:bg-sidebar-background gap-2 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
              size="lg"
              asChild
            >
              <a href="/">
                <Image
                  src="/icons/feather.svg"
                  alt="logo"
                  width={36}
                  height={36}
                  className="rounded-full"
                />

                <div className="text-sm group-data-[collapsible=icon]:hidden">
                  <span className="truncate  font-medium text-lg text-black">
                    Feather
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader> */}
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
