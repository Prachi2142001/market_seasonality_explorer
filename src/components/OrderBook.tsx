"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useOrderBook } from '@/context/OrderBookContext';
import { useMarketData } from '@/context/MarketDataContext';
import { Skeleton } from './ui/skeleton';

const OrderBook: React.FC = () => {
  const { orderBook, isConnected, isLoading, error } = useOrderBook();
  const { selectedSymbol } = useMarketData();
  const prevOrderBookRef = useRef(orderBook);
  const [priceChanges, setPriceChanges] = useState<{
    bids: Map<number, 'up' | 'down' | null>;
    asks: Map<number, 'up' | 'down' | null>;
  }>({ bids: new Map(), asks: new Map() });

  useEffect(() => {
    if (!orderBook) return;

    const newPriceChanges = {
      bids: new Map<number, 'up' | 'down' | null>(),
      asks: new Map<number, 'up' | 'down' | null>(),
    };

    orderBook.bids.forEach(([price, amount]) => {
      const prevBid = prevOrderBookRef.current?.bids.find(([p]) => p === price);
      if (prevBid) {
        newPriceChanges.bids.set(price, prevBid[1] < amount ? 'up' : 'down');
      }
    });

    orderBook.asks.forEach(([price, amount]) => {
      const prevAsk = prevOrderBookRef.current?.asks.find(([p]) => p === price);
      if (prevAsk) {
        newPriceChanges.asks.set(price, prevAsk[1] < amount ? 'up' : 'down');
      }
    });

    setPriceChanges(newPriceChanges);
    prevOrderBookRef.current = orderBook;
  }, [orderBook]);

  useEffect(() => {
    prevOrderBookRef.current = null;
  }, [selectedSymbol]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Order Book</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading order book</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderBook) {
    return null;
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(num);
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1000000) {
      return `${(vol / 1000000).toFixed(2)}M`;
    }
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(2)}K`;
    }
    return vol.toFixed(2);
  };

  const calculateTotal = (price: number, amount: number): number => {
    return price * amount;
  };

  const renderOrderBookSide = (
    orders: [number, number][],
    type: 'bids' | 'asks',
    maxTotal: number
  ) => {
    return orders.map(([price, amount], index) => {
      const total = calculateTotal(price, amount);
      const widthPercentage = (total / maxTotal) * 100;
      const change = priceChanges[type].get(price);
      
      return (
        <div key={`${type}-${price}-${index}`} className="relative py-1">
          <div
            className={`absolute inset-y-0 ${
              type === 'bids' ? 'right-0 bg-green-50' : 'left-0 bg-red-50'
            }`}
            style={{
              width: `${Math.min(widthPercentage, 100)}%`,
              opacity: 0.3,
            }}
          />
          <div className="grid grid-cols-3 text-sm relative z-10">
            <div className={`font-mono ${
              type === 'bids' ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatNumber(price)}
              {change && (
                <span className="ml-1">
                  {change === 'up' ? '↑' : '↓'}
                </span>
              )}
            </div>
            <div className="text-right font-mono">
              {formatVolume(amount)}
            </div>
            <div className="text-right font-mono text-gray-500">
              {formatNumber(total)}
            </div>
          </div>
        </div>
      );
    });
  };

  const allTotals = [
    ...orderBook.bids.map(([p, a]) => p * a),
    ...orderBook.asks.map(([p, a]) => p * a)
  ];
  const maxTotal = Math.max(...allTotals, 1);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Order Book</h2>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } mr-2`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 text-xs text-gray-500 mt-2">
          <div>Price (USDT)</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Total</div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
       
        <div className="p-2">
          {renderOrderBookSide(orderBook.bids, 'bids', maxTotal)}
        </div>

        <div className="p-2 bg-gray-50 text-center text-sm font-medium">
          {orderBook.bids[0] && orderBook.asks[0] ? (
            <>
              Spread: {formatNumber(orderBook.asks[0][0] - orderBook.bids[0][0])} (
              {((orderBook.asks[0][0] - orderBook.bids[0][0]) / orderBook.bids[0][0] * 100).toFixed(2)}%
              )
            </>
          ) : (
            'Loading...'
          )}
        </div>
        

        <div className="p-2">
          {renderOrderBookSide(orderBook.asks, 'asks', maxTotal)}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
