import { useEffect, useState, useCallback } from 'react';
import { BinanceWebSocket, StreamType } from '@/services/api/binanceWebSocket';

import { orderBookCache, priceCache } from '@/services/cache/dataCache';

interface MarketData {
    symbol: string;
    price: number | null;
    priceChangePercent: number | null;
    volume: number | null;
    timestamp: number;
    orderBook?: {
      timestamp: number;
      bids: [number, number][];
      asks: [number, number][];
    };
  }

interface TickerData {
  e: string;  // Event type
  E: number;  // Event time
  s: string;  // Symbol
  p: string;  // Price change
  P: string;  // Price change percent
  w: string;  // Weighted average price
  c: string;  // Last price
  Q: string;  // Last quantity
  o: string;  // Open price
  h: string;  // High price
  l: string;  // Low price
  v: string;  // Total traded base asset volume
  q: string;  // Total traded quote asset volume
  O: number;  // Statistics open time
  C: number;  // Statistics close time
  F: number;  // First trade ID
  L: number;  // Last trade ID
  n: number;  // Total number of trades
}

interface OrderBookData {
  e: string;  // Event type
  E: number;  // Event time
  s: string;  // Symbol
  U: number;  // First update ID
  u: number;  // Final update ID
  b: [string, string][];  // Bids to be updated
  a: [string, string][];  // Asks to be updated
}

export function useMarketData(symbol: string) {
  const [marketData, setMarketData] = useState<MarketData>({
    symbol,
    price: null,
    priceChangePercent: null,
    volume: null,
    timestamp: Date.now(),
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPriceCacheKey = (s: string) => `${s}_price`;
  const getOrderBookCacheKey = (s: string) => `${s}_orderbook`;

  useEffect(() => {
    const ws = new BinanceWebSocket([
      { symbol: symbol.toLowerCase(), type: 'ticker' },
      { symbol: symbol.toLowerCase(), type: 'depth' },
    ]);

    const loadCachedData = () => {
        const cachedPrice = priceCache.get(getPriceCacheKey(symbol));
        const cachedOrderBook = orderBookCache.get(getOrderBookCacheKey(symbol));
      
        if (cachedPrice || cachedOrderBook) {
          setMarketData(prev => ({
            ...prev,
            price: cachedPrice || prev.price,
            orderBook: cachedOrderBook ? {
              ...cachedOrderBook,
              timestamp: Date.now()
            } : prev.orderBook,
            timestamp: Date.now(),
          }));
        }
      };
      const handleTickerUpdate = (data: TickerData) => {
        const price = parseFloat(data.c);
        const priceChangePercent = parseFloat(data.P);
        const volume = parseFloat(data.v);
      
        // Use priceCache instead of orderBookCache for price
        priceCache.set(getPriceCacheKey(symbol), price, 30000);
      
        setMarketData(prev => ({
          ...prev,
          price,
          priceChangePercent,
          volume,
          timestamp: Date.now(),
        }));
      };

      const handleOrderBookUpdate = (data: OrderBookData) => {
        const orderBook = {
          timestamp: Date.now(),
          bids: data.b.map(([price, quantity]) => [
            parseFloat(price),
            parseFloat(quantity),
          ]) as [number, number][],
          asks: data.a.map(([price, quantity]) => [
            parseFloat(price),
            parseFloat(quantity),
          ]) as [number, number][],
        };
      
        orderBookCache.set(getOrderBookCacheKey(symbol), orderBook, 30000);
      
        setMarketData(prev => ({
          ...prev,
          orderBook,
          timestamp: Date.now(),
        }));
      };

    ws.on('connected', () => {
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
      loadCachedData();
    });

    ws.on('disconnected', () => {
      setIsConnected(false);
    });

    ws.on('error', (err: Error) => {
      setError(`Connection error: ${err.message}`);
      setIsLoading(false);
    });

    ws.on('ticker', handleTickerUpdate);
    ws.on('depthUpdate', handleOrderBookUpdate);
    ws.connect();

    return () => {
      ws.off('ticker', handleTickerUpdate);
      ws.off('depthUpdate', handleOrderBookUpdate);
      ws.disconnect();
    };
  }, [symbol]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    const ws = new BinanceWebSocket([
      { symbol: symbol.toLowerCase(), type: 'ticker' },
      { symbol: symbol.toLowerCase(), type: 'depth' },
    ]);
    ws.connect();
    
    const timer = setTimeout(() => {
      ws.disconnect();
      setIsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [symbol]);

  return {
    ...marketData,
    isConnected,
    isLoading,
    error,
    refresh,
  };
}

export function useMultipleMarketData(symbols: string[]) {
  const [data, setData] = useState<Record<string, MarketData>>({});
  
  useEffect(() => {
    const ws = new BinanceWebSocket(
      symbols.map(symbol => ({
        symbol: symbol.toLowerCase(),
        type: 'ticker' as StreamType,
      }))
    );

    const handleTickerUpdate = (data: TickerData) => {
      const symbol = data.s;
      const price = parseFloat(data.c);
      const priceChangePercent = parseFloat(data.P);
      const volume = parseFloat(data.v);

      setData(prev => ({
        ...prev,
        [symbol]: {
          ...prev[symbol],
          symbol,
          price,
          priceChangePercent,
          volume,
          timestamp: Date.now(),
        },
      }));
    };

    ws.on('connected', () => {
      const initialData: Record<string, MarketData> = {};
      symbols.forEach(symbol => {
        initialData[symbol] = {
          symbol,
          price: null,
          priceChangePercent: null,
          volume: null,
          timestamp: Date.now(),
        };
      });
      setData(initialData);
    });

    ws.on('ticker', handleTickerUpdate);
    ws.connect();

    return () => {
      ws.off('ticker', handleTickerUpdate);
      ws.disconnect();
    };
  }, [symbols.join(',')]);

  return data;
}