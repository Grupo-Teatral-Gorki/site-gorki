import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"], // pesos que você pode usar
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"], // pesos para títulos
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grupo Teatral Gorki",
  description: "Teatro e Cultura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.variable} ${playfair.variable} antialiased bg-yellow-50`}
      >
        {children}
      </body>
    </html>
  );
}
