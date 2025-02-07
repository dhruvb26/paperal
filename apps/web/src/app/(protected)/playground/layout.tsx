import { SidebarRight } from '@/components/sidebar-right'

export default async function PlaygroundLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-full">
      <main className="flex-1 relative">{children}</main>
      <SidebarRight />
    </div>
  )
}
