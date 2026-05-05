import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stacks — How much bank can you make?",
  description: "Pick a tile. Double your money. One wrong pick ends everything. The simple streak game everyone is playing.",
  keywords: "stacks game, fidget game, streak game, money game, simple game, casual game, free game, pick a tile, doubling game",
  openGraph: {
    title: "Stacks — How much bank can you make?",
    description: "Pick a tile. Double your money. One wrong pick ends everything.",
    url: "https://stacksgame.app",
    siteName: "Stacks",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Stacks — How much bank can you make?",
    description: "Pick a tile. Double your money. One wrong pick ends everything.",
  },
  metadataBase: new URL("https://stacksgame.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}