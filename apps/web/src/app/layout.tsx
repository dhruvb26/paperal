import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './styles/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { extractRouterConfig } from 'uploadthing/server'
import { ourFileRouter } from '@/app/api/uploadthing/core'
import { SWRConfig } from 'swr'
import { Toaster } from '@/components/ui/toaster'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PAPER - Predictive AI-Powered Paper Editing Resource',
  description:
    'Predictive AI-Powered Paper Editing Resource - your intelligent research companion.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
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
  )
}
