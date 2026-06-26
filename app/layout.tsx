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
  title: 'Bible Verse Sprint',
  description: 'How many Bible verses do you know?',
  keywords: "bible game, memory verse game, memory game, simple game, casual game, free game, pick a tile, doubling game",
  openGraph: {
    title: "Stacks — How much bank can you make?",
    description: "Match scripture to Chapter & Verse.",
    url: "https://stacksgame.app",
    siteName: "Stacks",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Bible Verse Sprint",
    description: "How many Bible verses do you know?",
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