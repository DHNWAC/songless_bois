'use client'

import dynamic from 'next/dynamic'

// Dynamic import with ssr:false must live in a client component.
// This wrapper lets us use it from the root server layout.
const ThemeToggle = dynamic(() => import('./ThemeToggle'), { ssr: false })

export default function ThemeToggleLoader() {
  return <ThemeToggle />
}
