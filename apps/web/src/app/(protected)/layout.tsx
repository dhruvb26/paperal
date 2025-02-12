import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { getDocuments } from '@/app/actions/documents'
import { getLibraries } from '@/app/actions/library'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const documents = await getDocuments()
  const libraries = await getLibraries()

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '350px',
        } as React.CSSProperties
      }
      defaultOpen={false}
    >
      <div className="flex h-screen w-full">
        <AppSidebar documents={documents} libraries={libraries} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  )
}
