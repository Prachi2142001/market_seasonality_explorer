import { KlineData } from "@/services/api/binance";

export const calculateIntradayVolatilityRange = (kline: KlineData): number => {
    const high = parseFloat(kline.high);
    const low = parseFloat(kline.low);
    const open = parseFloat(kline.open);
  
    if (open === 0) return 0;
  
    return ((high - low) / open) * 100; 
  };
  