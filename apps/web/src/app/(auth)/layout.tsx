import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    
    <div className="w-full flex items-center justify-center min-h-screen">
      {children}
    </div>
  )
}
