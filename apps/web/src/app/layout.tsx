import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import "./styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { getDocuments } from "@/app/actions/documents";
import { getLibraries } from "./actions/library";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/toaster";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feather - Research Companion",
  description: "Feather is your intelligent research companion.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <ClerkProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className} suppressHydrationWarning>
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />

            {children}

            <Toaster />
          </body>
        </html>
      </ClerkProvider>
    </SWRConfig>
  );
}
