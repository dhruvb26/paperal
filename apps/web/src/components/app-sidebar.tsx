"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useUser } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
} from "@/components/ui/sidebar";
import {
  GearSix,
  TerminalWindow,
  FadersHorizontal,
  File,
} from "@phosphor-icons/react";

import { getDocContent, getDocDate, getDocHeading } from "@/utils/render-doc";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createDocument } from "@/app/editor/actions";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Documents",
      url: "/editor",
      icon: <File size={24} />,
    },
    {
      title: "Playground",
      url: "/playground",
      icon: <TerminalWindow size={24} />,
    },
    {
      title: "Models",
      url: "/models",
      icon: <FadersHorizontal size={24} />,
    },

    {
      title: "Settings",
      url: "/settings",
      icon: <GearSix size={24} />,
    },
  ],
};

interface Document {
  id: string;
  createdAt: Date;
  updatedAt: Date | null;
  content: any | "";
  userId: string | null;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  documents?: Document[];
}

export function AppSidebar({ documents = [], ...props }: AppSidebarProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortDesc, setSortDesc] = React.useState(true);
  const pathname = usePathname();
  const [isNewDocOpen, setIsNewDocOpen] = React.useState(false);
  const [newDocPrompt, setNewDocPrompt] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const filteredDocuments = documents
    .filter((document) => {
      const title = getDocHeading(document.content)?.toLowerCase() || "";
      const content = getDocContent(document.content)?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();

      return title.includes(query) || content.includes(query);
    })
    .sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return sortDesc
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  const handleCreateDocument = async () => {
    if (!newDocPrompt.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const newDoc = await createDocument();
      setNewDocPrompt("");
      setIsNewDocOpen(false);
      window.location.href = `/editor/${newDoc}`;
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setIsCreating(false);
    }
  };

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
    <>
      <Sidebar
        collapsible="icon"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
        {...props}
      >
        <Sidebar
          collapsible="none"
          className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r group-data-[collapsible=icon]:border-r-0 transition-all duration-300"
        >
          <SidebarContent>
            <NavMain items={data.navMain} />
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={userData} />
          </SidebarFooter>
        </Sidebar>

        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="border-b p-2 flex justify-between flex-row">
            <SidebarInput
              className="rounded-sm"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SidebarHeader>
          <SidebarHeader className="border-b py-1 flex justify-between flex-row w-full">
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => setSortDesc(!sortDesc)}
            >
              Sort {sortDesc ? "↓" : "↑"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 shadow-none"
              onClick={() => setIsNewDocOpen(true)}
            >
              New
            </Button>

            <Dialog open={isNewDocOpen} onOpenChange={setIsNewDocOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                  <DialogDescription>
                    Enter a prompt to start your new document.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Enter your prompt..."
                    value={newDocPrompt}
                    onChange={(e) => setNewDocPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateDocument();
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsNewDocOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDocument} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupContent>
                {filteredDocuments.map((document) => (
                  <Link
                    href={`/editor/${document.id}`}
                    key={document.id}
                    className={`flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      pathname === `/editor/${document.id}`
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : ""
                    }`}
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="font-medium">
                        {getDocHeading(document.content)}
                      </span>
                      <span className="ml-auto text-xs">
                        {getDocDate(document.createdAt)}
                      </span>
                    </div>

                    <span className="line-clamp-2 w-[260px] text-muted-foreground whitespace-break-spaces text-xs">
                      {getDocContent(document.content)}
                    </span>
                  </Link>
                ))}
                {filteredDocuments.length === 0 && (
                  <div className="p-4 text-sm text-center w-full">
                    No results found.
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Sidebar>
    </>
  );
}
