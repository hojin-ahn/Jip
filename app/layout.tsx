import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ApolloProvider } from '@/components/ApolloProvider'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: '집 (Jip) — 신뢰 기반 부동산 플랫폼',
  description: '허위 매물 없는 신뢰 기반 부동산 검색 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <ApolloProvider>
          {children}
          <Toaster />
        </ApolloProvider>
      </body>
    </html>
  )
}
