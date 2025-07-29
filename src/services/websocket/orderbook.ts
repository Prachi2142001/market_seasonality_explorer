import { EventEmitter } from 'events';

export interface OrderbookUpdate {
  symbol: string;
  bids: [number, number][]; // [price, quantity][]
  asks: [number, number][]; // [price, quantity][]
  timestamp: number;
}

class OrderbookWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private url: string;
  private subscribedSymbols = new Set<string>();
  private isConnected = false;

  constructor(apiUrl: string) {
    super();
    this.url = apiUrl;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected');
      
      // Resubscribe to any symbols that were previously subscribed
      if (this.subscribedSymbols.size > 0) {
        this.subscribeToSymbols([...this.subscribedSymbols]);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('update', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      console.log('WebSocket disconnected');
      this.emit('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  subscribeToSymbols(symbols: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Subscription will be attempted on connect.');
      symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
      return;
    }

    symbols.forEach(symbol => {
      this.subscribedSymbols.add(symbol);
      const subscriptionMsg = JSON.stringify({
        action: 'subscribe',
        symbol: symbol
      });
      this.ws?.send(subscriptionMsg);
    });
  }

  unsubscribeFromSymbols(symbols: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    symbols.forEach(symbol => {
      this.subscribedSymbols.delete(symbol);
      const unsubscriptionMsg = JSON.stringify({
        action: 'unsubscribe',
        symbol: symbol
      });
      this.ws?.send(unsubscriptionMsg);
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.emit('disconnected');
    }
  }

  isConnectionOpen(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
export const orderbookWebSocket = new OrderbookWebSocket('wss://your-websocket-api.com/orderbook');

// Auto-connect when imported
orderbookWebSocket.connect();

export default orderbookWebSocket;
