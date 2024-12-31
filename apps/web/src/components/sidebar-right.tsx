"use client";
import * as React from "react";
import { useSidebarStore } from "@/store/sidebar-store";
import { Textarea } from "@/components/ui/textarea";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  PaperPlaneRight,
  PaperPlaneTilt,
  StopCircle,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { isRightSidebarOpen, edgeData } = useSidebarStore();
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      body: {
        edgeData: {
          sourceNode: edgeData?.sourceNode?.data?.label,
          targetNode: edgeData?.targetNode?.data?.label,
        },
      },
      onResponse: (response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
      },
    });

  const edgeDataForAi = {
    sourceNode: edgeData?.sourceNode?.data?.label,
    targetNode: edgeData?.targetNode?.data?.label,
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Sidebar
      collapsible="none"
      className={`sticky hidden text-center lg:flex top-0  ${
        isRightSidebarOpen ? "border-l transition-all" : ""
      }`}
      style={
        {
          "--sidebar-width": "28rem",
        } as React.CSSProperties
      }
      open={isRightSidebarOpen}
      {...props}
    >
      <SidebarHeader className="p-4">
        <h2 className="text-sm font-medium text-foreground">ChatGraph</h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-6 py-0">
        <span className="text-xs text-muted-foreground">
          Chat with your graph coming soon.
        </span>
        {/* <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex text-xs ${
                message.role === "user"
                  ? "justify-end text-right"
                  : "justify-start text-left"
              }`}
            >
              <div
                className={`max-w-[80%] break-words overflow-wrap-anywhere px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-t-2xl rounded-l-2xl rounded-br"
                    : "bg-muted text-foreground rounded-t-2xl rounded-r-2xl rounded-bl"
                }`}
              >
                <ReactMarkdown className="overflow-hidden [&_p]:mb-4 last:[&_p]:mb-0">
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div> */}

        {/* <form
          onSubmit={handleSubmit}
          className="flex w-full items-end justify-center flex-row gap-2 py-4"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder=""
            style={{
              fontSize: "12px",
            }}
            disabled={isLoading}
            className="text-xs placeholder:text-xs min-h-8 py-1 px-3"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`; // 128px = 8rem = 32 (max-h-32)
            }}
          />
          {isLoading ? (
            <Button size="sm" className="h-8" onClick={() => stop()}>
              <Loader className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size={"icon"}
              className="h-8"
              variant={"ghost"}
            >
              <PaperPlaneRight size={16} />
            </Button>
          )}
        </form> */}
      </SidebarContent>
    </Sidebar>
  );
}
