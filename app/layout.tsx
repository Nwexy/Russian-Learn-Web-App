/**
 * Kök layout — tüm sayfalar bu layout içinde render edilir.
 * ThemeProvider, LangProvider, DatabaseInit ve Navbar burada yer alır.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { LangProvider } from "@/lib/lang-context";
import { DatabaseInit } from "@/components/database-init";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Learn Russian",
  description: "A1-A2 Russian learning app with SRS and grammar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learn Russian",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6d28d9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <PwaRegister />
        <ThemeProvider>
          <LangProvider>
            <DatabaseInit />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
