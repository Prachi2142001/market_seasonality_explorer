"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

import { useMarketData } from '@/hooks/useMarketData';

export interface OrderBookContextType {
    orderBook: {
        bids: [number, number][];
        asks: [number, number][];
        timestamp: number;
    } | null;
    price: number | null;
    priceChangePercent: number | null;
    volume: number | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    subscribe: (symbol: string) => void;
    unsubscribe: () => void;
    refresh: () => void;
}

const OrderBookContext = createContext<OrderBookContextType | undefined>(undefined);

export const OrderBookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentSymbol, setCurrentSymbol] = useState<string>('btcusdt');
    const [lastUpdate, setLastUpdate] = useState<number>(0);

    // Use the new useMarketData hook
    const {
        price,
        priceChangePercent,
        volume,
        orderBook: marketDataOrderBook,
        isConnected,
        isLoading,
        error,
        refresh,
    } = useMarketData(currentSymbol);


    const orderBook = marketDataOrderBook
        ? {
            bids: marketDataOrderBook.bids,
            asks: marketDataOrderBook.asks,
            timestamp: marketDataOrderBook.timestamp || Date.now()
        }
        : null;


    const getOrderBookCacheKey = (s: string) => `${s}_orderbook`;


    const subscribe = useCallback((symbol: string) => {
        setCurrentSymbol(symbol);
    }, []);


    const unsubscribe = useCallback(() => {

    }, []);

    return (
        <OrderBookContext.Provider
            value={{
                orderBook: orderBook || null,
                price,
                priceChangePercent,
                volume,
                isConnected,
                isLoading,
                error,
                subscribe,
                unsubscribe,
                refresh,
            }}
        >
            {children}
        </OrderBookContext.Provider>
    );
};

export const useOrderBook = (): OrderBookContextType => {
    const context = useContext(OrderBookContext);
    if (context === undefined) {
        throw new Error('useOrderBook must be used within an OrderBookProvider');
    }
    return context;
};

export const usePriceData = () => {
    const { price, priceChangePercent, volume, isConnected, isLoading, error } = useOrderBook();
    return { price, priceChangePercent, volume, isConnected, isLoading, error };
};

export const useOrderBookData = () => {
    const { orderBook, isConnected, isLoading, error } = useOrderBook();
    return { orderBook, isConnected, isLoading, error };
};
