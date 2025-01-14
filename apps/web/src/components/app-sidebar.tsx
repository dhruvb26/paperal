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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  GearSix,
  TerminalWindow,
  Archive,
  File,
  BookOpen,
  Plus,
  ArrowsLeftRight,
  ArrowDown,
  ArrowUp,
  CaretRight,
  Pencil,
} from "@phosphor-icons/react";

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
import { ArrowRightLeft, Pen } from "lucide-react";

const data = {
  navMain: [
    {
      title: "Documents",
      url: "/editor",
      icon: <File weight="duotone" />,
    },

    {
      title: "Library",
      url: "/library",
      icon: <BookOpen weight="duotone" />,
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
    return null;
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
        variant="floating"
        collapsible="offcanvas"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row "
        {...props}
      >
        <Sidebar
          collapsible="offcanvas"
          variant="floating"
          className="hidden flex-1 md:flex rounded-lg "
        >
          <SidebarHeader className=" flex justify-between flex-row">
            <SidebarInput
              className="rounded-md"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SidebarHeader>

          <SidebarHeader className="flex justify-between flex-row w-full">
            {showLibraryList ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setSortDesc(!sortDesc)}
                >
                  Sort{" "}
                  {sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                </Button>

                <CustomUploadButton />
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setSortDesc(!sortDesc)}
                >
                  Sort{" "}
                  {sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsNewDocOpen(true)}
                >
                  <Pen className="stroke-1" size={16} />
                </Button>
              </>
            )}

            <NewDocumentDialog
              isOpen={isNewDocOpen}
              onOpenChange={setIsNewDocOpen}
            />
          </SidebarHeader>
          <SidebarContent className=" rounded-lg">
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
      <div className="flex flex-col items-center max-h-fit justify-start gap-2 p-2 rounded-lg  relative left-8 top-8">
        <SidebarTrigger className=" z-10 bg-blue-600 hover:bg-blue-500 hover:translate-y-[-1px] border-blue-900 border-b-4 text-white hover:text-white transition-all duration-300" />

        <Button
          className="bg-blue-600  z-10 hover:bg-blue-500 hover:translate-y-[-1px] border-blue-900 border-b-4 text-white hover:text-white transition-all duration-300"
          size="icon"
          variant="outline"
          onClick={() => handleEditorClick()}
        >
          <File size={16} />
        </Button>
        <Button
          className="bg-blue-600  z-10 hover:bg-blue-500 hover:translate-y-[-1px] border-blue-900 border-b-4 text-white hover:text-white transition-all duration-300"
          size="icon"
          variant="outline"
          onClick={() => handleLibraryClick()}
        >
          <BookOpen size={16} />
        </Button>
      </div>
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
