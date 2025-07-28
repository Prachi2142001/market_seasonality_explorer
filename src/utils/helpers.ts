import { VolatilityLevel } from "@/types";

export const getVolatilityLevel = (volatility: number): VolatilityLevel => {
    if (volatility > 0.1) return 'high';
    if (volatility > 0.05) return 'medium';
    return 'low';
  };