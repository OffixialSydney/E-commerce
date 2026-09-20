import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: {
    default: "Sid Bespoke — Style Made Personal",
    template: "%s | Sid Bespoke",
  },
  description:
    "Discover carefully selected pieces designed to elevate your everyday style. Shop clothing, shoes, bags, accessories and more at Sid Bespoke.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Sid Bespoke — Style Made Personal",
    description:
      "Discover carefully selected pieces designed to elevate your everyday style.",
    siteName: "Sid Bespoke",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
