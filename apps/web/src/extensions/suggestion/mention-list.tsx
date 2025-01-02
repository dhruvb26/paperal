import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, Plus } from "@phosphor-icons/react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { LibraryDocument } from "./index";
import axios from "axios";

interface MentionListProps {
  items: Array<LibraryDocument>;
  command: (props: {
    id: string;
    href?: string;
    citations?: {
      "in-text"?: string;
      "after-text"?: string;
    };
  }) => void;
  isLoading?: boolean;
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [libraryItems, setLibraryItems] = useState<LibraryDocument[]>([]);
    const [discoverItems, setDiscoverItems] = useState<LibraryDocument[]>([]);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);
    const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);

    const selectItem = (index: number) => {
      const item = props.items[index];

      if (item) {
        props.command({
          id: item.id,
          href: item.metadata?.fileUrl || "#",
          citations: item.metadata?.citations,
        });
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    const handleCite = (item: LibraryDocument) => {
      props.command({
        id: item.id,
        href: item.metadata?.fileUrl || "#",
        citations: item.metadata?.citations,
      });
    };

    const handleView = (item: LibraryDocument) => {
      window.open(item.metadata?.fileUrl || "#", "_blank");
    };

    const fetchDiscoverItems = async () => {
      setIsDiscoverLoading(true);
      try {
        const response = await axios.get("/api/library/discover");
        const { documents } = response.data;
        setDiscoverItems(documents);
      } catch (error) {
        console.error("Error fetching discover items:", error);
      } finally {
        setIsDiscoverLoading(false);
      }
    };

    const fetchLibraryItems = async () => {
      setIsLibraryLoading(true);
      try {
        const response = await axios.get("/api/library/all");
        const { documents } = response.data;
        setLibraryItems(documents);
      } catch (error) {
        console.error("Error fetching library items:", error);
      } finally {
        setIsLibraryLoading(false);
      }
    };

    useEffect(() => {
      fetchLibraryItems();
      fetchDiscoverItems();
    }, []);

    return (
      <Tabs
        defaultValue="library"
        className="border border-muted rounded-md p-1 bg-white"
      >
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        <TabsContent value="library">
          <div>
            {isLibraryLoading ? (
              <ScrollArea style={{ height: "250px" }}>
                <div
                  className="flex items-center justify-center"
                  style={{ minHeight: "250px", width: "450px" }}
                >
                  <span className="text-muted-foreground text-xs">
                    <Loader />
                  </span>
                </div>
              </ScrollArea>
            ) : libraryItems.length ? (
              <ScrollArea
                style={{ height: "250px", width: "450px" }}
                className="pr-6 pl-2 py-1"
              >
                {libraryItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col items-start gap-2 p-2 citation-div">
                      <div className="flex flex-col space-y-1 items-start text-xs">
                        <span className="text-xs line-clamp-2">
                          {item.title}
                        </span>
                        <span className="text-xs w-full text-muted-foreground line-clamp-2">
                          {item.metadata?.authors?.join(", ")}
                        </span>
                        <span className="text-xs text-muted-foreground italic">
                          {item.metadata?.year}
                        </span>
                        <span className="text-xs line-clamp-2 text-muted-foreground mt-2">
                          {item.description}
                          <span className="text-xs text-muted-foreground font-medium">
                            see more
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <button
                            className="flex text-xs items-center gap-1 hover:underline text-foreground"
                            onClick={() => handleCite(item)}
                          >
                            <Plus size={12} weight="bold" />
                            Cite
                          </button>
                          <button
                            className="flex text-xs items-center gap-1 hover:underline text-foreground"
                            onClick={() => handleView(item)}
                          >
                            <ArrowUpRight size={12} weight="bold" />
                            View
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs italic">Library</span>
                        </div>
                      </div>
                    </div>
                    <Separator
                      className={`${
                        index === libraryItems.length - 1 ? "hidden" : ""
                      }`}
                    />
                  </React.Fragment>
                ))}
              </ScrollArea>
            ) : (
              <ScrollArea style={{ height: "250px" }}>
                <div
                  className="flex items-center justify-center"
                  style={{ minHeight: "250px", width: "450px" }}
                >
                  <span className="text-muted-foreground text-xs">
                    No results.
                  </span>
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
        <TabsContent value="discover">
          <div>
            {isDiscoverLoading ? (
              <ScrollArea style={{ height: "250px" }}>
                <div
                  className="flex items-center justify-center"
                  style={{ minHeight: "250px", width: "450px" }}
                >
                  <span className="text-muted-foreground text-xs">
                    <Loader />
                  </span>
                </div>
              </ScrollArea>
            ) : discoverItems.length ? (
              <ScrollArea
                style={{ height: "250px", width: "450px" }}
                className="pr-6 pl-2 py-1"
              >
                {discoverItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col items-start gap-2 p-2 citation-div">
                      <div className="flex flex-col space-y-1 items-start text-xs">
                        <span className="text-xs line-clamp-2">
                          {item.title}
                        </span>
                        <span className="text-xs w-full text-muted-foreground line-clamp-2">
                          {item.metadata?.authors?.join(", ")}
                        </span>
                        <span className="text-xs text-muted-foreground italic">
                          {item.metadata?.year}
                        </span>
                        <span className="text-xs line-clamp-2 text-muted-foreground mt-2">
                          {item.description}
                          <span className="text-xs text-muted-foreground font-medium">
                            see more
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <button
                            className="flex text-xs items-center gap-1 hover:underline text-foreground"
                            onClick={() => handleCite(item)}
                          >
                            <Plus size={12} weight="bold" />
                            Cite
                          </button>
                          <button
                            className="flex text-xs items-center gap-1 hover:underline text-foreground"
                            onClick={() => handleView(item)}
                          >
                            <ArrowUpRight size={12} weight="bold" />
                            View
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs italic">Discover</span>
                        </div>
                      </div>
                    </div>
                    <Separator
                      className={`${
                        index === discoverItems.length - 1 ? "hidden" : ""
                      }`}
                    />
                  </React.Fragment>
                ))}
              </ScrollArea>
            ) : (
              <ScrollArea style={{ height: "250px" }}>
                <div
                  className="flex items-center justify-center"
                  style={{ minHeight: "250px", width: "450px" }}
                >
                  <span className="text-muted-foreground text-xs">
                    No results found.
                  </span>
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  }
);
