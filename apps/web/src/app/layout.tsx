import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://loveymoji.app"),
  title: "Loveymoji",
  description: "Responsive mobile uploads powered by Next.js, tRPC, and Prisma.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Loveymoji",
    description: "Responsive mobile uploads powered by Next.js, tRPC, and Prisma.",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Loveymoji",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loveymoji",
    description: "Responsive mobile uploads powered by Next.js, tRPC, and Prisma.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
