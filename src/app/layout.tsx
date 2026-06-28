import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Jimsongdle",
  description: "Guess the song from a clip",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jimsongdle",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom for accessibility; iOS focus-zoom is prevented via 16px inputs.
  maximumScale: 5,
  // viewport-fit=cover lets env(safe-area-inset-*) report real notch/home-bar insets.
  viewportFit: "cover",
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

      </body>
    </html>
  );
}
