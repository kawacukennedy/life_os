import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/contexts/ToastContext'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import Navigation from '@/components/Navigation'
import { ApolloProvider } from '@apollo/client'
import client from '@/components/GraphQLProvider'
import { PerformanceMonitor } from '@/lib/performance'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LifeOS - Unified Personal Operating System',
  description: 'Consolidate your health, finances, productivity, learning, and social life into one intelligent platform powered by AI.',
  keywords: 'life management, AI assistant, productivity, health tracking, finance management, task management, learning platform',
  authors: [{ name: 'LifeOS Team' }],
  creator: 'LifeOS',
  publisher: 'LifeOS',
  openGraph: {
    title: 'LifeOS - Unified Personal Operating System',
    description: 'Consolidate your health, finances, productivity, learning, and social life into one intelligent platform powered by AI.',
    type: 'website',
    locale: 'en_US',
    siteName: 'LifeOS',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LifeOS Platform Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifeOS - Unified Personal Operating System',
    description: 'Consolidate your health, finances, productivity, learning, and social life into one intelligent platform powered by AI.',
    creator: '@lifeos',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize performance monitoring
  if (typeof window !== 'undefined') {
    PerformanceMonitor.init()
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloProvider client={client}>
          <ReactQueryProvider>
            <ToastProvider>
              <Navigation />
              <main>{children}</main>
            </ToastProvider>
          </ReactQueryProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}