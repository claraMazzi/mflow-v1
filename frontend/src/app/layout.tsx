import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@components/ui/sonner";
import { NextAuthProvider } from "@components/auth/provider";
import { LayoutProvider } from "@components/global/Context";

const Exo = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
      <body className={`${Exo.variable} antialiased`}>
        <NextAuthProvider>
          <LayoutProvider>
          <main>
            <Toaster />
            <div className="block">{children}</div>
            {/* <div className="block lg:hidden">
              <div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
                <div className="w-full max-w-md bg-white shadow-md rounded-md p-8 border border-gray-200">
                  <h1 className="text-3xl font-medium text-center text-purple-600">
                    MFLOW
                  </h1>
                  <p>No se encuentra disponible para dispositivos móbiles</p>
                </div>
              </div>
            </div> */}
          </main>
          </LayoutProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
