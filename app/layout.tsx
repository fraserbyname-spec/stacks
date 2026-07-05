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
  title: 'Stacks',
  description: 'Build a Stack every day. Grow your balance forever.',
  openGraph: {
    title: 'Stacks',
    description: 'Build a Stack every day. Grow your balance forever.',
    url: 'https://stacksgame.app',
    siteName: 'Stacks',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Stacks',
    description: 'Build a Stack every day. Grow your balance forever.',
  }
}

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