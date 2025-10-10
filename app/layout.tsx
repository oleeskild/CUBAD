import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cubad - Azure Cosmos DB UI',
  description: 'A better UI for Azure Cosmos DB',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
