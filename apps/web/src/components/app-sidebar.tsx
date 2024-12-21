"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useUser } from "@clerk/nextjs";
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
      title: "Documents",
      url: "#",
      icon: <TerminalWindow size={24} />,
      isActive: true,
      items: [
        {
          title: "Editor",
          url: "/editor",
        },
        {
          title: "Playground",
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
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const name = user.fullName;
  const email = user.emailAddresses[0].emailAddress;
  const avatar = user.imageUrl;

  const userData = {
    name: name ?? "",
    email: email ?? "",
    avatar: avatar ?? "",
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
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

                <div className="group-data-[collapsible=icon]:hidden flex flex-col">
                  <span className="font-medium text-black font-mono uppercase">
                    Feather
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Where search begins
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
