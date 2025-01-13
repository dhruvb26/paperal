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
  ArrowBendRightUp,
  ArrowRight,
  PaperPlaneRight,
  PaperPlaneTilt,
  StopCircle,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

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
      variant="floating"
      className={cn(
        "max-h-full text-center relative transition-[width] duration-300 ease-in-out w-96 bg-background p-2",
        isRightSidebarOpen ? "w-96" : "w-0 overflow-hidden"
      )}
      open={isRightSidebarOpen}
      {...props}
    >
      <SidebarContent className="flex flex-col rounded-lg border">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 m-4">
          <p className="text-xs text-muted-foreground py-2">
            Work in progress.
          </p>
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
                    ? "bg-primary text-primary-foreground rounded-md"
                    : "bg-accent text-accent-foreground rounded-md"
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
          className="flex w-full items-end justify-center flex-row p-4 relative"
        >
          <div className="relative w-full">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question..."
              style={{
                fontSize: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
              }}
              disabled={isLoading}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />

            <Button
              isLoading={isLoading}
              type="submit"
              className="absolute bottom-2 right-2 h-6 w-6 text-muted-foreground"
              size={"icon"}
              variant={"ghost"}
              onClick={isLoading ? () => stop() : () => {}}
            >
              {isLoading ? null : <PaperPlaneTilt size={8} />}
            </Button>
          </div>
        </form>
      </SidebarContent>
    </Sidebar>
  );
}
