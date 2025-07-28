import { subYears, startOfDay, endOfDay, format } from 'date-fns';
import { fetchHistoricalData, KlineData } from './api/binance';
import { CalendarMetrics, VolatilityLevel } from '@/types';

const calculateVolatility = (high: number, low: number): number => {
  return (high - low) / low; 
};

const getVolatilityLevel = (volatility: number): VolatilityLevel => {
  if (volatility > 0.1) return 'high';
  if (volatility > 0.05) return 'medium';
  return 'low';
};

const calculatePerformance = (open: number, close: number): number => {
  return ((close - open) / open) * 100;
};

export const fetchMarketData = async (
  symbol: string = 'BTCUSDT',
  monthsBack: number = 12
): Promise<CalendarMetrics[]> => {
  try {
    const endDate = new Date();
    const startDate = subYears(endDate, 1);
    
    const klines = await fetchHistoricalData(symbol, '1d', startDate, endDate);
    const metrics: CalendarMetrics[] = klines.map(kline => {
      const open = parseFloat(kline.open);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const close = parseFloat(kline.close);
      const volume = parseFloat(kline.volume);
      const volatility = calculateVolatility(high, low);
      
      return {
        date: new Date(kline.openTime),
        open,
        close,
        volume,
        volatility,
        performance: calculatePerformance(open, close),
      };
    });

    return metrics;
  } catch (error) {
    console.error('Error in fetchMarketData:', error);
    throw error;
  }
};

export const getDataForDate = (
  date: Date,
  data: CalendarMetrics[]
): CalendarMetrics | undefined => {
  const targetDate = startOfDay(date).getTime();
  return data.find(item => {
    const itemDate = startOfDay(item.date).getTime();
    return itemDate === targetDate;
  });
};

export const getDataForDateRange = (
  startDate: Date,
  endDate: Date,
  data: CalendarMetrics[]
): CalendarMetrics[] => {
  const start = startOfDay(startDate).getTime();
  const end = endOfDay(endDate).getTime();
  
  return data.filter(item => {
    const itemTime = item.date.getTime();
    return itemTime >= start && itemTime <= end;
  });
};

export const getLatestData = (data: CalendarMetrics[]): CalendarMetrics | null => {
  if (data.length === 0) return null;
  return [...data].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
};
