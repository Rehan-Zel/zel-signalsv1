import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zel Signals — AI Trading Signal Generator",
  description: "Real market data + AI analysis = structured trade signals. Paper trade and track your win rate.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0c0f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0c0f] text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
