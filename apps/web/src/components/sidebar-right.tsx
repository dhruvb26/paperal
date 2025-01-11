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
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoaded } = useUser();
  const { isRightSidebarOpen, selectedLink } = useSidebarStore();
  const params = useParams();
  const documentId = params.page;
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      body: {
        userId: user?.id,
        userSentence: selectedLink?.sentence,
        documentId,
        title: selectedLink?.title,
      },
      onResponse: (response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
      },
    });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoaded)
    return <div className="flex justify-center items-center h-full"></div>;

  return (
    <Sidebar
      collapsible="none"
      className={`h-full text-center sticky top-0 right-0 transition-transform duration-300 w-96 
        ${isRightSidebarOpen ? "" : "hidden"} border-l`}
      open={isRightSidebarOpen}
      {...props}
    >
      <SidebarContent className="flex flex-col px-6 ">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex text-xs ${
                message.role === "user"
                  ? "justify-end text-left"
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
        </div>

        <form
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
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          {isLoading ? (
            <Button
              size="sm"
              variant={"ghost"}
              className="h-8"
              onClick={() => stop()}
            >
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
        </form>
      </SidebarContent>
    </Sidebar>
  );
}
