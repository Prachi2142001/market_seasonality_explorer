import { EventEmitter } from 'events';

export interface OrderBookUpdate {
  e: string; 
  E: number;
  s: string; 
  U: number; 
  u: number; 
  b: [string, string][]; 
  a: [string, string][];
}

export interface OrderBookSnapshot {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][]; 
}

export type StreamType = 'depth' | 'ticker' | 'kline' | 'trades';

export interface StreamSubscription {
  symbol: string;
  type: StreamType;
  interval?: string; 
}

export class BinanceWebSocket extends EventEmitter {
  private socket: WebSocket | null = null;
  private baseUrl = 'wss://stream.binance.com:9443/ws';
  private streamName: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isConnected: boolean = false;
  private activeSubscriptions: StreamSubscription[] = [];
  private symbol: string = 'btcusdt';
  private orderBook: {
    lastUpdateId: number;
    bids: Map<number, number>;
    asks: Map<number, number>;
  } = { lastUpdateId: 0, bids: new Map(), asks: new Map() };

  constructor(initialSubscriptions: StreamSubscription[] = [
    { symbol: 'btcusdt', type: 'depth' },
    { symbol: 'btcusdt', type: 'ticker' }
  ]) {
    super();
    this.activeSubscriptions = [...initialSubscriptions];
    this.streamName = this.buildStreamName();
  }

  private buildStreamName(): string {
    return this.activeSubscriptions
      .map(sub => {
        const symbol = sub.symbol.toLowerCase();
        switch (sub.type) {
          case 'depth':
            return `${symbol}@depth`;
          case 'ticker':
            return `${symbol}@ticker`;
          case 'kline':
            return `${symbol}@kline_${sub.interval || '1m'}`;
          case 'trades':
            return `${symbol}@trade`;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('/');
  }

  public connect(): void {
    if (this.socket) {
      this.disconnect();
    }

    const wsUrl = `${this.baseUrl}/stream?streams=${this.streamName}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log(`WebSocket connected to ${this.streamName}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data: OrderBookUpdate = JSON.parse(event.data);
        this.processUpdate(data);
        this.emit('update', this.getOrderBook());
      } catch (error) {
        this.emit('error', new Error(`Error processing WebSocket message: ${error}`));
      }
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      this.emit('disconnected');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      this.emit('error', new Error(`WebSocket error: ${error}`));
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.log('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  private processUpdate(update: OrderBookUpdate): void {

    if (this.orderBook.lastUpdateId === 0) return;

    if (update.u <= this.orderBook.lastUpdateId) {
      return;
    }

    update.b.forEach(([price, quantity]) => {
      const priceNum = parseFloat(price);
      const qty = parseFloat(quantity);
      
      if (qty === 0) {
        this.orderBook.bids.delete(priceNum);
      } else {
        this.orderBook.bids.set(priceNum, qty);
      }
    });

    update.a.forEach(([price, quantity]) => {
      const priceNum = parseFloat(price);
      const qty = parseFloat(quantity);
      
      if (qty === 0) {
        this.orderBook.asks.delete(priceNum);
      } else {
        this.orderBook.asks.set(priceNum, qty);
      }
    });

    this.orderBook.lastUpdateId = update.u;
  }

  public async initializeOrderBook(): Promise<void> {
    try {

      const snapshot = await this.fetchOrderBookSnapshot();
      this.orderBook = {
        lastUpdateId: snapshot.lastUpdateId,
        bids: new Map(snapshot.bids.map(([p, q]) => [parseFloat(p), parseFloat(q)])),
        asks: new Map(snapshot.asks.map(([p, q]) => [parseFloat(p), parseFloat(q)])),
      };
      
      this.emit('initialized', this.getOrderBook());
    } catch (error) {
      this.emit('error', new Error(`Failed to initialize order book: ${error}`));
    }
  }

  private async fetchOrderBookSnapshot(): Promise<OrderBookSnapshot> {
    const response = await fetch(
      `https://api.binance.com/api/v3/depth?symbol=${this.symbol.toUpperCase()}&limit=1000`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch order book snapshot: ${response.statusText}`);
    }
    
    return response.json();
  }

  public getOrderBook() {
    return {
      bids: Array.from(this.orderBook.bids.entries())
        .sort(([a], [b]) => b - a) 
        .slice(0, 100), 
      asks: Array.from(this.orderBook.asks.entries())
        .sort(([a], [b]) => a - b) 
        .slice(0, 100), 
      lastUpdateId: this.orderBook.lastUpdateId,
      timestamp: Date.now(),
    };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.emit('disconnected');
    }
  }

  public subscribe(subscription: StreamSubscription): void {
    const exists = this.activeSubscriptions.some(
      sub => sub.symbol === subscription.symbol && sub.type === subscription.type
    );
    
    if (!exists) {
      this.activeSubscriptions.push(subscription);
      this.streamName = this.buildStreamName();
      
      if (this.isConnected) {
        this.reconnect();
      }
    }
  }

  public unsubscribe(subscription: StreamSubscription): void {
    const initialLength = this.activeSubscriptions.length;
    this.activeSubscriptions = this.activeSubscriptions.filter(
      sub => !(sub.symbol === subscription.symbol && sub.type === subscription.type)
    );
    
    if (this.activeSubscriptions.length !== initialLength && this.isConnected) {
      this.streamName = this.buildStreamName();
      this.reconnect();
    }
  }

  private reconnect(): void {
    this.disconnect();
    this.connect();
  }

  public isActive(): boolean {
    return this.isConnected;
  }

  public changeSymbol(newSymbol: string): void {
    this.symbol = newSymbol;
    this.activeSubscriptions = this.activeSubscriptions.map(sub => ({
      ...sub,
      symbol: newSymbol
    }));
    this.streamName = this.buildStreamName();
    this.disconnect();
    this.connect();
  }
}

export const binanceWebSocket = new BinanceWebSocket();
