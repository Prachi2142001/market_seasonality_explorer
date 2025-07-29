"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useMarketData } from "@/context/MarketDataContext";
import { useCalendar } from "@/context/CalendarContext";
import { Calendar as CalendarIcon, RefreshCw, AlertCircle } from "lucide-react";
import FilterControls from "@/components/FilterControls";

const Calendar = dynamic(() => import("@/components/Calendar"), { ssr: false });

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'Bitcoin (BTC/USDT)' },
  { value: 'ETHUSDT', label: 'Ethereum (ETH/USDT)' },
  { value: 'SOLUSDT', label: 'Solana (SOL/USDT)' },
  { value: 'BNBUSDT', label: 'BNB (BNB/USDT)' },
  { value: 'XRPUSDT', label: 'XRP (XRP/USDT)' },
];

export default function Home() {
  const { loading, error, selectedSymbol, setSelectedSymbol, refreshData } = useMarketData();
  const { viewMode, setViewMode } = useCalendar();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["volatility"]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center flex-shrink-0">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 mr-2" />
                <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Market Seasonality Explorer</h4>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch flex-wrap sm:items-end gap-0 sm:gap-4">
              <div className="flex-1 min-w-0">
                <label htmlFor="symbol" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Asset
                </label>
                <select
                  id="symbol"
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="lg:w-96 sm:w-40 text-xs sm:text-sm px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                >
                  {SYMBOLS.map((symbol) => (
                    <option key={symbol.value} value={symbol.value} className="text-xs sm:text-sm">
                      {symbol.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">View Mode</label>
                <div className="flex rounded-md shadow-sm border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('daily')}
                    className={`flex-1 py-2 border-r-1 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                      viewMode === 'daily' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`flex-1 py-2 px-2 sm:px-3 border-r-1 text-xs sm:text-sm font-medium transition-all duration-200 ${
                      viewMode === 'weekly' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`flex-1 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                      viewMode === 'monthly' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="flex-shrink-0 mt-3 sm:mt-0">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh Data</span>
                  <span className="sm:hidden">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 lg:p-6">
            {loading && !isRefreshing ? (
              <div className="flex flex-col items-center justify-center h-64 sm:h-80 lg:h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-600">Loading market data...</p>
              </div>
            ) : (
              <div className="flex flex-col min-h-[calc(100vh-200px)] sm:min-h-[calc(100vh-240px)] lg:min-h-[calc(100vh-280px)]">
                <div className="flex-shrink-0 mb-4 sm:mb-6">
                  <FilterControls
                    selectedMetrics={selectedMetrics}
                    setSelectedMetrics={setSelectedMetrics}
                  />
                </div>

                <div className="flex-1 overflow-auto">
                  <Calendar selectedMetrics={selectedMetrics} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">Legend</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 mr-2 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">High Volatility</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-yellow-400 mr-2 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">Medium Volatility</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">Low Volatility</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600">Volume Indicator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}