export type VolatilityLevel = "low" | "medium" | "high";

export type Metric = {
  open: string;
  close: string;
  volume: string;
  volatility: VolatilityLevel;
  liquidity?: number;
};

export type CalendarState = {
  currentMonth: Date;
  metricsMap: Map<string, Metric>;
  volatilityMap: Map<string, VolatilityLevel>;
  focusedDate: string | null;
};

export type CalendarMetrics = {
  date: Date;
  open: number;
  close: number;
  volume: number;
  volatility: number;
  liquidity?: number;
  performance: number;
};

  

export type ViewMode = "monthly" | "weekly" | "daily";
