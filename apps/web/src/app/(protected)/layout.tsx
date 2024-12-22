import { SidebarTrigger } from "@/components/ui/sidebar";

import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SidebarInset>
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-2.5">
          <SidebarTrigger className="-ml-1" />
        </header>

        <main className="flex min-h-screen flex-col flex-1 relative">
          {children}
          <Toaster />
        </main>
      </SidebarInset>
    </>
  );
}
