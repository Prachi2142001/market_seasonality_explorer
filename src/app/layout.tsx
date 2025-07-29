import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Modal from "@/components/Modal";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export const metadata: Metadata = {
  title: "Market Seasonality Explorer",
  description: "Interactive calendar for visualizing market data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <Providers>
          <div className="min-h-screen flex flex-col bg-gray-50 relative">
            <main className="flex-1 p-4 md:p-6">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                <ConnectionStatus />
              </div>
            </footer>
            <Modal />
          </div>
        </Providers>
      </body>
    </html>
  );
}
