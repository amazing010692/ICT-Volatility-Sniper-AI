import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ICT Volatility Sniper AI — Elite M1 Scalping",
  description: "Hyper-sensitive M1 XAUUSD scalping platform with ICT Smart Money Concepts, AI reasoning, and real-time signal generation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] text-zinc-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
