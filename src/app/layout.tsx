import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
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
  title: "Kun Yeung (កុន យើង) | Movies & Stories",
  description:
    "Movies, memories, and stories. Stream exclusive cinema, Cambodian stories, and originals on Kun Yeung.",
  keywords: [
    "Kun Yeung",
    "កុន យើង",
    "streaming",
    "movies",
    "khmer movies",
    "cinema",
    "watch online",
    "ultra hd",
  ],
  icons: {
    icon: "/kon-yeung-icon.png",
    shortcut: "/kon-yeung-icon.png",
    apple: "/kon-yeung-icon.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#0A0A0C] text-white flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
