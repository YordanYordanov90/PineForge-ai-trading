import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Inter, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PRODUCT_NAME } from "@/lib/brand";
import { ThemeProvider } from "@/components/theme-provider";

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description:
    "Generate clean, copy-ready TradingView Pine Script v5 strategies with alert tiers and SL/TP lines.",
  applicationName: PRODUCT_NAME,
  openGraph: {
    type: "website",
    title: PRODUCT_NAME,
    description:
      "Generate clean, copy-ready TradingView Pine Script v5 strategies with alert tiers and SL/TP lines.",
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_NAME,
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
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, syne.variable)}
    >
      <body className="flex min-h-full w-full flex-col">
        <ThemeProvider>
          <ClerkProvider>
            {children}
          </ClerkProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}


