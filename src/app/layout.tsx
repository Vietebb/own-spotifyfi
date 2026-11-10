import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura Music — Sub-100ms Streaming Platform",
  description:
    "Lightweight, low-latency music streaming system architecture and platform proposal by Balgyn Baikozhayev.",
  keywords: [
    "Aura Music",
    "Music Streaming",
    "ICT System Architecture",
    "Sub-100ms Audio",
    "Supabase",
    "Next.js",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-aura-blush text-slate-900 font-sans selection:bg-aura-pink selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
