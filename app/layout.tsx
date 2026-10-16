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

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Rusça Öğren",
  description: "Yerel çalışan, internet gerektirmeyen Rusça öğrenme uygulaması.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
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
