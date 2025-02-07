import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const TermsOfService = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      {' '}
      <p className="text-accent-foreground">Terms of Service.</p>
      <Link href="/">
        <Button variant="link" className="mt-4 text-muted-foreground">
          Home
        </Button>
      </Link>
    </div>
  )
}

export default TermsOfService
