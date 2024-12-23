import React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsThreeVertical } from "@phosphor-icons/react";

interface Library {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  metadata: any;
}

interface LibraryListProps {
  libraries: Library[];
  searchQuery: string;
  sortDesc: boolean;
  pathname: string;
  setLibraryToDelete: (id: string | null) => void;
}

export const LibraryList: React.FC<LibraryListProps> = ({
  libraries,
  searchQuery,
  sortDesc,
  pathname,
  setLibraryToDelete,
}) => {
  const filteredLibraries = libraries
    .filter((library) => {
      const title = library.title.toLowerCase();
      const description = library.description.toLowerCase();
      const query = searchQuery.toLowerCase();

      return title.includes(query) || description.includes(query);
    })
    .sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return sortDesc
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {filteredLibraries.map((library) => (
        <div
          key={library.id}
          className={`flex flex-col items-start gap-2 whitespace-nowrap border-b p-2 text-sm leading-tight ${
            pathname === `/library/${library.id}`
              ? "bg-white text-sidebar-accent-foreground"
              : ""
          }`}
        >
          <div className="flex w-full items-center gap-2">
            <Link href={`/library/${library.id}`} className="flex-1 truncate">
              <span className="font-medium truncate hover:underline">
                {library.title}
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
                  onClick={() => setLibraryToDelete(library.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <span className="line-clamp-2 w-[260px] text-muted-foreground whitespace-break-spaces text-xs">
            {library.description}
          </span>
          <div className="flex w-full justify-between text-xs text-muted-foreground italic">
            <span>{formatDate(library.createdAt)}</span>
            <span>{library.isPublic ? "Public" : "Private"}</span>
          </div>
        </div>
      ))}
      {filteredLibraries.length === 0 && (
        <div className="p-4 text-sm text-center w-full">No results found.</div>
      )}
    </div>
  );
};
