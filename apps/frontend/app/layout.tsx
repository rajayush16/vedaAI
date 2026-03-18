import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "VedaAI Assignment Creator",
  description: "Teacher-facing AI assessment creator for building assignments and question papers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
