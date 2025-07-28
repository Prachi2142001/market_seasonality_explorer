import axios from 'axios';
import { format, subDays } from 'date-fns';

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

const API_BASE_URL = 'https://api.binance.com/api/v3';

/**
 * Fetches historical kline/candlestick data from Binance API
 * @param symbol Trading pair (e.g., 'BTCUSDT')
 * @param interval Time interval (e.g., '1d' for daily, '1w' for weekly)
 * @param startTime Start time in milliseconds
 * @param endTime End time in milliseconds
 * @param limit Number of data points to return (max 1000)
 */
export const fetchKlines = async (
  symbol: string = 'BTCUSDT',
  interval: string = '1d',
  startTime?: number,
  endTime?: number,
  limit: number = 1000
): Promise<KlineData[]> => {
  try {
    const params: Record<string, string | number> = {
      symbol,
      interval,
      limit,
    };

    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const response = await axios.get(`${API_BASE_URL}/klines`, { params });
    
    // Map response to KlineData interface
    return response.data.map((kline: any[]): KlineData => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10],
      ignore: kline[11],
    }));
  } catch (error) {
    console.error('Error fetching klines:', error);
    throw error;
  }
};

/**
 * Fetches historical data for a given date range
 * Handles pagination if more than 1000 data points are needed
 */
export const fetchHistoricalData = async (
  symbol: string = 'BTCUSDT',
  interval: string = '1d',
  startDate: Date,
  endDate: Date = new Date(),
  limit: number = 1000
): Promise<KlineData[]> => {
  let allData: KlineData[] = [];
  let currentStart = startDate.getTime();
  const endTime = endDate.getTime();

  try {
    while (currentStart < endTime) {
      const batch = await fetchKlines(
        symbol,
        interval,
        currentStart,
        endTime,
        limit
      );

      if (batch.length === 0) break;

      allData = [...allData, ...batch];
      
      // If we got less than the limit, we've reached the end
      if (batch.length < limit) break;
      
      // Set next start time to 1ms after the last close time
      currentStart = batch[batch.length - 1].closeTime + 1;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return allData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

/**
 * Fetches order book snapshot
 */
export const fetchOrderBook = async (
  symbol: string = 'BTCUSDT',
  limit: number = 100
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/depth`, {
      params: { symbol, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order book:', error);
    throw error;
  }
};

/**
 * Fetches 24hr ticker price change statistics
 */
export const fetchTicker24hr = async (symbol: string = 'BTCUSDT') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/ticker/24hr`, {
      params: { symbol },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching 24hr ticker:', error);
    throw error;
  }
};
