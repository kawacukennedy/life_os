import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PWARegister from '@/components/PWARegister'
import OfflineInitializer from '@/components/OfflineInitializer'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AuthProvider } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import LayoutWrapper from '@/components/LayoutWrapper'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import GraphQLProvider from '@/components/GraphQLProvider'
import '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LifeOS',
  description: 'Unified AI-driven personal operating system',
  manifest: '/manifest.json',
  themeColor: '#4F46E5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-start text-white px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>
        <ThemeProvider>
           <ErrorBoundary>
             <AuthProvider>
               <ReactQueryProvider>
                 <GraphQLProvider>
                   <ToastProvider>
                     <PWARegister />
                     <OfflineInitializer />
                     <LayoutWrapper>
                       {children}
                     </LayoutWrapper>
                   </ToastProvider>
                 </GraphQLProvider>
               </ReactQueryProvider>
             </AuthProvider>
           </ErrorBoundary>
         </ThemeProvider>
      </body>
    </html>
  )
}