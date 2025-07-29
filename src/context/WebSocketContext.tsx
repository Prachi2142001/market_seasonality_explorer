"use client";

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { orderbookWebSocket, OrderbookUpdate } from '@/services/websocket/orderbook';

interface WebSocketContextType {
  isConnected: boolean;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  addUpdateListener: (callback: (data: OrderbookUpdate) => void) => void;
  removeUpdateListener: (callback: (data: OrderbookUpdate) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isConnected = orderbookWebSocket.isConnectionOpen();
  const updateListeners = useRef<((data: OrderbookUpdate) => void)[]>([]);

  useEffect(() => {
   
    orderbookWebSocket.connect();

    return () => {
      orderbookWebSocket.disconnect();
    };
  }, []);

  const handleUpdate = (data: OrderbookUpdate) => {
    updateListeners.current.forEach(callback => callback(data));
  };

  useEffect(() => {
  
    orderbookWebSocket.on('update', handleUpdate);

    return () => {

      orderbookWebSocket.off('update', handleUpdate);
    };
  }, []);

  const subscribeToSymbol = (symbol: string) => {
    orderbookWebSocket.subscribeToSymbols([symbol]);
  };

  const unsubscribeFromSymbol = (symbol: string) => {
    orderbookWebSocket.unsubscribeFromSymbols([symbol]);
  };

  const addUpdateListener = (callback: (data: OrderbookUpdate) => void) => {
    if (!updateListeners.current.includes(callback)) {
      updateListeners.current.push(callback);
    }
  };

  const removeUpdateListener = (callback: (data: OrderbookUpdate) => void) => {
    updateListeners.current = updateListeners.current.filter(cb => cb !== callback);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        subscribeToSymbol,
        unsubscribeFromSymbol,
        addUpdateListener,
        removeUpdateListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
