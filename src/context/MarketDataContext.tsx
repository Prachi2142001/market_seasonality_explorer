"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CalendarMetrics } from '@/types';
import { fetchMarketData } from '@/services/marketDataService';

interface MarketDataContextType {
  marketData: CalendarMetrics[];
  loading: boolean;
  error: string | null;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  refreshData: () => Promise<void>;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export const MarketDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<CalendarMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMarketData(selectedSymbol);
      setMarketData(data);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError('Failed to load market data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSymbol]);

  return (
    <MarketDataContext.Provider
      value={{
        marketData,
        loading,
        error,
        selectedSymbol,
        setSelectedSymbol,
        refreshData: loadData,
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketData = (): MarketDataContextType => {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
};
