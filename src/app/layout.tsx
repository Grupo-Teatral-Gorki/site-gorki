import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteDataProvider } from "@/context/SiteDataContext";
import AppChrome from "@/components/AppChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grupo Teatral Gorki",
  description: "Grupo Teatral Gorki - Teatro, cultura e arte.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteDataProvider>
          <AppChrome>
            {/* Adjust pt-16 handled inside AppChrome when header is visible */}
            {children}
          </AppChrome>
        </SiteDataProvider>
      </body>
    </html>
  );
}
