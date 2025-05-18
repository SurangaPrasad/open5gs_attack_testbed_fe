import './globals.css'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'


export const metadata: Metadata = {
  title: 'Open5GS Web Interface',
  description: 'Web interface for Open5GS 5G Core Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
} 