import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Oriki Hair — Luxury units, made in Lagos",
  description:
    "Hand-finished luxury wigs cut to your length and coloured to your mood in our Lagos atelier. Delivered across Nigeria.",
};

export const viewport: Viewport = {
  themeColor: "#f4efe8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${instrument.variable} ${hanken.variable} antialiased`}>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
