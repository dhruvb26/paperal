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
  DotsThree,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { getDocContent, getDocDate, getDocHeading } from "@/utils/render-doc";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { NewDocumentDialog } from "@/components/document/new-document-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDocument } from "@/app/actions/documents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [documentToDelete, setDocumentToDelete] = React.useState<string | null>(
    null
  );
  const router = useRouter();
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

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      setDocumentToDelete(null);
      router.push("/editor");
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
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

        {/* Secondary sidebar */}
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

            <NewDocumentDialog
              isOpen={isNewDocOpen}
              onOpenChange={setIsNewDocOpen}
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupContent>
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className={`flex flex-col items-start gap-2 whitespace-nowrap border-b p-2 text-sm leading-tight ${
                      pathname === `/editor/${document.id}`
                        ? "bg-white text-sidebar-accent-foreground"
                        : ""
                    }`}
                  >
                    <div className="flex w-full items-center gap-2">
                      <Link
                        href={`/editor/${document.id}`}
                        className="flex-1 truncate"
                      >
                        <span className="font-medium truncate hover:underline">
                          {getDocHeading(document.content)}
                        </span>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <DotsThreeVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDocumentToDelete(document.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <span className="line-clamp-2 w-[260px] text-muted-foreground whitespace-break-spaces text-xs">
                      {getDocContent(document.content)}
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      {getDocDate(document.createdAt)}
                    </span>
                  </div>
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

      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={() => setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                documentToDelete && handleDeleteDocument(documentToDelete)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
