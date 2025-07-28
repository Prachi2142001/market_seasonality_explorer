import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MarketDataProvider } from "@/context/MarketDataContext";
import { CalendarProvider } from "@/context/CalendarContext";
import { ModalProvider } from "@/context/ModalContext";
import Modal from "@/components/Modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans h-full`}>
        <MarketDataProvider>
          <CalendarProvider>
            <ModalProvider>
              <div className="min-h-screen flex flex-col bg-gray-50 relative">
                <header className="bg-white shadow-sm">
                  <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">Market Seasonality Explorer</h1>
                  </div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                  {children}
                </main>
                <footer className="bg-white border-t border-gray-200 py-4">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                    Market data provided by Binance API
                  </div>
                </footer>
                <Modal />
              </div>
            </ModalProvider>
          </CalendarProvider>
        </MarketDataProvider>
      </body>
    </html>
  );
}
