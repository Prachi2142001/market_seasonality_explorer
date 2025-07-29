"use client";

import { useOrderBook } from "@/context/OrderBookContext";

export function ConnectionStatus() {
  const { isConnected } = useOrderBook();

  return (
    <span>
      Market data provided by Binance API
      {isConnected && <span className="ml-1 text-green-500">• Live</span>}
    </span>
  );
}
