'use client';

import { GeistProvider, CssBaseline } from '@geist-ui/core';
import { MarketDataProvider } from "@/context/MarketDataContext";
import { CalendarProvider } from "@/context/CalendarContext";
import { OrderBookProvider } from "@/context/OrderBookContext";
import { ModalProvider } from "@/context/ModalContext";
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <GeistProvider>
      <CssBaseline />
      <MarketDataProvider>
        <OrderBookProvider>
          <CalendarProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </CalendarProvider>
        </OrderBookProvider>
      </MarketDataProvider>
    </GeistProvider>
  );
}
