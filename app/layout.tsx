import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollObserver from "@/components/ScrollObserver";

export const runtime = "edge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pakde Griya | Broker Properti No.1 Di Dunia",
  description: "Temukan hunian impian dan investasi properti terbaik bersama Pakde Griya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col font-sans`}>
        {/* ScrollObserver menangani class .scroll-blur agar aktif saat di-scroll */}
        <ScrollObserver />
        {children}
      </body>
    </html>
  );
}