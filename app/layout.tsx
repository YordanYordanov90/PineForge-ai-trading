import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Grok Trading Strategy Generator",
    template: "%s · Grok Trading Strategy Generator",
  },
  description:
    "Generate clean, copy-ready TradingView Pine Script v5 strategies with alert tiers and SL/TP lines.",
  applicationName: "Grok Trading Strategy Generator",
  openGraph: {
    type: "website",
    title: "Grok Trading Strategy Generator",
    description:
      "Generate clean, copy-ready TradingView Pine Script v5 strategies with alert tiers and SL/TP lines.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grok Trading Strategy Generator",
    description:
      "Generate clean, copy-ready TradingView Pine Script v5 strategies with alert tiers and SL/TP lines.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, syne.variable)}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}


