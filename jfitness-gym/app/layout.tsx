import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JFitness Gym Management System',
  description: 'Gym management and monitoring system for JFitness Gym, Malaybalay City',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
