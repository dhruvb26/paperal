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
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feather",
  description: "Feather is your intelligent research companion.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const documents = await getDocuments();
  const libraries = await getLibraries();

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className} suppressHydrationWarning>
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <SidebarProvider
            defaultOpen={false}
            style={
              {
                "--sidebar-width": "350px",
              } as React.CSSProperties
            }
          >
            <AppSidebar
              documents={documents}
              libraries={libraries.map((lib) => ({
                ...lib,
                isPublic: lib.isPublic ?? false,
              }))}
            />
            {children}
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
