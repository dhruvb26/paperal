import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ModeToggle } from "@/components/mode-toggle";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarInset className="flex flex-col h-screen">
        <header className="sticky top-0 flex justify-between shrink-0 items-center border-b bg-background gap-2 px-4 py-2 z-50">
          <SidebarTrigger />
          <ModeToggle />
        </header>

        <main className="flex flex-col flex-1 overflow-auto">{children}</main>
      </SidebarInset>
      <Toaster />
    </ThemeProvider>
  );
}
