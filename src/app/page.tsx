"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useMarketData } from "@/context/MarketDataContext";
import { useCalendar } from "@/context/CalendarContext";
import { Calendar as CalendarIcon, RefreshCw, AlertCircle } from "lucide-react";


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

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Market Seasonality Explorer</h1>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <label htmlFor="symbol" className="text-center block text-sm font-medium text-gray-700 mb-1">
                Asset
              </label>
              <select
                id="symbol"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {SYMBOLS.map((symbol) => (
                  <option key={symbol.value} value={symbol.value}>
                    {symbol.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-center">View</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1 text-sm rounded-l-md cursor-pointer ${
                    viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-3 py-1 text-sm cursor-pointer ${
                    viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1 text-sm rounded-r-md cursor-pointer  ${
                    viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className="inline-flex items-center cursor-pointer px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="p-4 sm:p-6">
          {loading && !isRefreshing ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <Calendar />
          )}
        </div>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-600">High Volatility</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-yellow-400 mr-2"></div>
            <span className="text-sm text-gray-600">Medium Volatility</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-600">Low Volatility</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm text-gray-600">Volume Indicator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
