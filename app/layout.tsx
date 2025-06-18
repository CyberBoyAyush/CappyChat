import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './styles.css';
import 'katex/dist/katex.min.css';
import { Toaster } from '@/frontend/components/ui/BasicComponents';
import { ThemeProvider } from '@/frontend/components/ui/ThemeComponents';
import { Analytics } from '@vercel/analytics/react';
import PerformanceOptimizations from '@/frontend/components/PerformanceOptimizations';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AVChat - Fastest AI Chat App',
  description: 'Fastest AI Chat App',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AVChat - Fastest AI Chat App',
    description: 'Fastest AI Chat App',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'AVChat - Fastest AI Chat App',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVChat - Fastest AI Chat App',
    description: 'Fastest AI Chat App',
    images: ['/banner.png'],
  },
  other: {
    // Performance optimization meta tags
    'dns-prefetch': 'https://avchatbackend.ayush-sharma.in',
    'preconnect': 'https://avchatbackend.ayush-sharma.in',
    'viewport': 'width=device-width, initial-scale=1, maximum-scale=1',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PerformanceOptimizations />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
