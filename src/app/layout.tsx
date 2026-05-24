import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title:
    'Concurrency-Safe Inventory Reservation',

  description:
    'Distributed inventory booking with PostgreSQL serializable transactions.',
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">

      <body suppressHydrationWarning>

        {children}

      </body>
    </html>
  )
}