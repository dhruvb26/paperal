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

interface MentionListProps {
  items: Array<{
    id: string;
    title: string;
    metadata?: {
      fileUrl?: string;
      year?: string;
      authors?: string[];
      citations?: {
        "in-text"?: string;
        "after-text"?: string;
      };
    };
  }>;
  command: (props: {
    id: string;
    href?: string;
    citations?: {
      "in-text"?: string;
      "after-text"?: string;
    };
  }) => void;
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

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

    const handleCite = (item: {
      id: string;
      title: string;
      metadata?: {
        fileUrl?: string;
        year?: string;
        citations?: {
          "in-text"?: string;
          "after-text"?: string;
        };
      };
    }) => {
      props.command({
        id: item.id,
        href: item.metadata?.fileUrl || "#",
        citations: item.metadata?.citations,
      });
    };

    const handleView = (item: {
      id: string;
      title: string;
      metadata?: { fileUrl?: string };
    }) => {
      window.open(item.metadata?.fileUrl || "#", "_blank");
    };

    return (
      <Tabs
        defaultValue="library"
        className="border border-muted rounded-md p-1"
      >
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        <TabsContent value="library">
          <div>
            {props.items.length ? (
              props.items.map((item, index) => (
                <ScrollArea
                  style={{ height: "250px" }}
                  className="pr-6"
                  key={index}
                >
                  <div
                    className={`flex flex-col items-start gap-2 p-2 ${
                      index === selectedIndex ? "" : ""
                    }`}
                  >
                    <div
                      className="flex flex-col space-y-1 items-start text-xs"
                      style={{ width: "450px" }}
                    >
                      <span className="text-xs truncate">{item.title}</span>
                      <span className="text-xs truncate w-full text-muted-foreground">
                        {item.metadata?.authors?.join(", ")}
                      </span>
                      <span className="text-xs text-muted-foreground italic">
                        {item.metadata?.year}
                      </span>

                      <span className="text-xs text-muted-foreground mt-2 overflow-hidden">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Sed do eiusmod tempor incididunt ...
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
                  <Separator />
                </ScrollArea>
              ))
            ) : (
              <div className="item">No result</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="discover">
          <ScrollArea style={{ height: "250px" }}>
            <div
              className="flex items-center justify-center"
              style={{ minHeight: "250px", width: "450px" }}
            >
              <span className="text-muted-foreground text-xs">
                Discover content coming soon...
              </span>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    );
  }
);
