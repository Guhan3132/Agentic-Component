import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "Live, copyable UX patterns for AI agents: streaming, trust, approval, planning, chat and input. React, Tailwind, shadcn-ready.";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentic-component.vercel.app"),
  title: { default: "Agentic UI: UX patterns for AI agents", template: "%s · Agentic UI" },
  description,
  keywords: ["AI agent UI", "chat UI components", "shadcn", "React", "Tailwind", "human in the loop", "streaming UI"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Agentic UI",
    title: "Agentic UI: UX patterns for AI agents",
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Agentic UI: UX patterns for AI agents", description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
