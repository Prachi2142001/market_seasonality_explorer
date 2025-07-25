import type { CalendarMetrics } from "../types";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export type AggregatedMetrics = {
  periodStart: Date;
  periodEnd: Date;
  avgVolatility: number;
  totalVolume: number;
  performanceChange: number;
};

export function aggregateWeeklyMetrics(
  metrics: CalendarMetrics[]
): AggregatedMetrics[] {
  if (metrics.length === 0) return [];

  // Step 1: Sort metrics by date (ascending)
  const sortedMetrics = [...metrics].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Step 2: Determine the overall date range
  const firstDate = startOfWeek(sortedMetrics[0].date, { weekStartsOn: 0 }); // Sunday
  const lastDate = endOfWeek(sortedMetrics[sortedMetrics.length - 1].date, { weekStartsOn: 0 }); // Saturday

  const weeklyData: AggregatedMetrics[] = [];

  let currentWeekStart = new Date(firstDate);

  while (currentWeekStart <= lastDate) {
    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

    // Step 3: Filter metrics within this week
    const weekMetrics = sortedMetrics.filter(metric => {
      return metric.date >= currentWeekStart && metric.date <= currentWeekEnd;
    });

    if (weekMetrics.length > 0) {
      const sortedWeek = [...weekMetrics].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      const totalVolume = weekMetrics.reduce((sum, m) => sum + m.volume, 0);
      const avgVolatility =
        weekMetrics.reduce((sum, m) => sum + m.volatility, 0) /
        weekMetrics.length;

      const performanceChange =
        sortedWeek[sortedWeek.length - 1].close - sortedWeek[0].open;

      weeklyData.push({
        periodStart: new Date(currentWeekStart),
        periodEnd: new Date(currentWeekEnd),
        totalVolume,
        avgVolatility,
        performanceChange,
      });
    } else {
      weeklyData.push({
        periodStart: new Date(currentWeekStart),
        periodEnd: new Date(currentWeekEnd),
        totalVolume: 0,
        avgVolatility: 0,
        performanceChange: 0,
      });
    }

    // Move to next week (Sunday of next week)
    currentWeekStart = addDays(currentWeekEnd, 1);
  }

  return weeklyData;
}

export const aggregateMonthlyMetrics = (
  metrics: CalendarMetrics[]
): AggregatedMetrics[] => {
  const groupedByMonth: Record<string, CalendarMetrics[]> = {};

  metrics.forEach((entry) => {
    const key = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(entry);
  });

  return Object.values(groupedByMonth).map((group) => {
    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());

    const periodStart = sorted[0].date;
    const periodEnd = sorted[sorted.length - 1].date;

    const avgVolatility =
      group.reduce((sum, item) => sum + (typeof item.volatility === "number" ? item.volatility : 0), 0) /
      group.length;
    const totalVolume = group.reduce((sum, item) => sum + item.volume, 0);
    const performanceChange = sorted[sorted.length - 1].close - sorted[0].open;

    return {
      periodStart,
      periodEnd,
      avgVolatility,
      totalVolume,
      performanceChange,
    };
  });
};
