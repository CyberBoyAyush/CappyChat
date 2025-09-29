import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ToastViewport } from "@/frontend/components/ui/Toast";
import { ThemeProvider } from "@/frontend/components/ui/ThemeComponents";
import { Analytics } from "@vercel/analytics/react";
import PerformanceOptimizations from "@/frontend/components/PerformanceOptimizations";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CappyChat - Fastest AI Chat App",
  description:
    "Experience the fastest AI chat application with real-time responses, multiple AI models, and seamless conversations.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "CappyChat - Fastest AI Chat App",
    description:
      "Experience the fastest AI chat application with real-time responses, multiple AI models, and seamless conversations.",
    url: "https://cappychat.com",
    siteName: "CappyChat",
    images: [
      {
        url: "https://res.cloudinary.com/dyetf2h9n/image/upload/v1759138327/AV_1_zztl3w.png",
        width: 1200,
        height: 630,
        alt: "CappyChat - Fastest AI Chat App",
        type: "image/png",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CappyChat - Fastest AI Chat App",
    description:
      "Experience the fastest AI chat application with real-time responses, multiple AI models, and seamless conversations.",
    images: [
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1759138327/AV_1_zztl3w.png",
    ],
    creator: "@cyberboyayush",
    site: "@cyberboyayush",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with your actual verification code
  },
  other: {
    // Performance optimization meta tags
    "dns-prefetch": "https://cappychatbackend.cappychat.com",
    preconnect: "https://cappychatbackend.cappychat.com",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    // Additional Open Graph meta tags for better link previews
    "og:image:secure_url":
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1759138327/AV_1_zztl3w.png",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": "CappyChat - Fastest AI Chat App",
    // LinkedIn specific
    "linkedin:owner": "cyberboyayush",
    // WhatsApp specific
    "whatsapp:image":
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1759138327/AV_1_zztl3w.png",
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
          defaultTheme="capybara-dark"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "capybara-light", "capybara-dark"]}
        >
          <PerformanceOptimizations />
          {children}
          <ToastViewport />
        </ThemeProvider>
        <Analytics />

        {/* Analytics Tracking Script */}
        <Script
          src="https://stats.cappychat.com/script.js"
          data-website-id="07137fa5-ef9f-43f3-afca-6700de099829"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
