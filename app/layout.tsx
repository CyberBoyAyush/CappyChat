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
  description: 'Experience the fastest AI chat application with real-time responses, multiple AI models, and seamless conversations.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AVChat - Fastest AI Chat App',
    description: 'Experience the fastest AI chat application with real-time responses, multiple AI models, and seamless conversations.',
    url: 'https://avchat.ayush-sharma.in',
    siteName: 'AVChat',
    images: [
      {
        url: 'https://avchat.ayush-sharma.in/banner.png',
        width: 1200,
        height: 630,
        alt: 'AVChat - Fastest AI Chat App',
        type: 'image/png',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVChat - Fastest AI Chat App',
    description: 'Experience the fastest AI chat application with real-time responses, multiple AI models, and seamless conversations.',
    images: ['https://avchat.ayush-sharma.in/banner.png'],
    creator: '@cyberboyayush',
    site: '@cyberboyayush',
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
    google: 'your-google-verification-code', // Replace with your actual verification code
  },
  other: {
    // Performance optimization meta tags
    'dns-prefetch': 'https://avchatbackend.ayush-sharma.in',
    'preconnect': 'https://avchatbackend.ayush-sharma.in',
    'viewport': 'width=device-width, initial-scale=1, maximum-scale=1',
    // Additional Open Graph meta tags for better link previews
    'og:image:secure_url': 'https://avchat.ayush-sharma.in/banner.png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': 'AVChat - Fastest AI Chat App',
    // LinkedIn specific
    'linkedin:owner': 'cyberboyayush',
    // WhatsApp specific
    'whatsapp:image': 'https://avchat.ayush-sharma.in/banner.png',
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
