import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Exo_2 } from "next/font/google";
import "./globals.css";

const Exo = Exo_2({
  variable: "--font-exo",
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "Mflow",
  description: "Generate Simulation Models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${Exo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
