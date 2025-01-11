"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useUser } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  GearSix,
  TerminalWindow,
  Archive,
  HouseSimple,
} from "@phosphor-icons/react";
import File from "@/components/icons/file";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { NewDocumentDialog } from "@/components/document/new-document-dialog";
import { deleteDocument } from "@/app/actions/documents";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/document/document-list";
import { DeleteDocumentDialog } from "@/components/document/delete-document-dialog";
import { LibraryList } from "@/components/document/library-list";
import { deleteLibrary } from "@/app/actions/library";
import { CustomUploadButton } from "./uploadthing/custom-upload-button";
import { SidebarSkeleton } from "@/components/sidebar-skeleton";
import { LibraryDocument } from "@/types/models/library";
import { Document } from "@/types/models/document";
import House2 from "@/components/icons/house-2";
import BookOpen from "@/components/icons/book";
import Gear2 from "@/components/icons/gear-2";
const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: <House2 />,
    },
    {
      title: "Documents",
      url: "/editor",
      icon: <File />,
    },

    {
      title: "Library",
      url: "/library",
      icon: <BookOpen />,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Gear2 />,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  documents?: Document[];
  libraries?: LibraryDocument[];
}

export function AppSidebar({
  documents = [],
  libraries = [],
  ...props
}: AppSidebarProps) {
  const { toast } = useToast();
  const { isLoaded, isSignedIn, user } = useUser();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortDesc, setSortDesc] = React.useState(true);
  const pathname = usePathname();
  const [isNewDocOpen, setIsNewDocOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<string | null>(
    null
  );
  const [libraryToDelete, setLibraryToDelete] = React.useState<string | null>(
    null
  );
  const { toggleSidebar, open } = useSidebar();
  const router = useRouter();
  const [showLibraryList, setShowLibraryList] = React.useState(false);

  if (!isLoaded) {
    return <SidebarSkeleton />;
  }

  if (!isSignedIn) {
    return null;
  }

  const userData = {
    name: user.fullName ?? "",
    email: user.emailAddresses[0].emailAddress ?? "",
    avatar: user.imageUrl ?? "",
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      setDocumentToDelete(null);
      router.refresh();
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleDeleteLibrary = async (libraryId: string) => {
    try {
      await deleteLibrary(libraryId);

      setLibraryToDelete(null);
      toast({
        title: "Document Deleted",
        description: "The library document has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete library:", error);
    }
  };

  const handleLibraryClick = () => {
    setShowLibraryList(true);
    if (!open) {
      toggleSidebar();
    }
  };

  const handleEditorClick = () => {
    setShowLibraryList(false);
    if (!open) {
      toggleSidebar();
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
            <NavMain
              items={data.navMain}
              onLibraryClick={handleLibraryClick}
              onEditorClick={handleEditorClick}
            />
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={userData} />
          </SidebarFooter>
        </Sidebar>

        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="border-b flex justify-between flex-row">
            <SidebarInput
              className="rounded-sm"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SidebarHeader>

          <SidebarHeader className="border-b flex justify-between flex-row w-full">
            {showLibraryList ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => setSortDesc(!sortDesc)}
                >
                  Sort {sortDesc ? "↓" : "↑"}
                </Button>
                <CustomUploadButton />
              </>
            ) : (
              <>
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
              </>
            )}

            <NewDocumentDialog
              isOpen={isNewDocOpen}
              onOpenChange={setIsNewDocOpen}
            />
          </SidebarHeader>
          <SidebarContent>
            {showLibraryList ? (
              <LibraryList
                libraries={libraries}
                searchQuery={searchQuery}
                sortDesc={sortDesc}
                pathname={pathname}
                setLibraryToDelete={setLibraryToDelete}
              />
            ) : (
              <DocumentList
                documents={documents}
                searchQuery={searchQuery}
                sortDesc={sortDesc}
                pathname={pathname}
                setDocumentToDelete={setDocumentToDelete}
              />
            )}
          </SidebarContent>
        </Sidebar>
      </Sidebar>

      <DeleteDocumentDialog
        documentToDelete={documentToDelete}
        onDelete={handleDeleteDocument}
        onCancel={() => setDocumentToDelete(null)}
      />

      <DeleteDocumentDialog
        documentToDelete={libraryToDelete}
        onDelete={handleDeleteLibrary}
        onCancel={() => setLibraryToDelete(null)}
      />
    </>
  );
}
