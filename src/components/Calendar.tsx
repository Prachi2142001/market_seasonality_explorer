"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import CalendarHeader from "./CalendarHeader";
import CalendarCell from "./CalendarCell";
import { useCalendar } from "@/context/CalendarContext";
import { useMarketData } from "@/context/MarketDataContext";
import { VolatilityLevel } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { getVolatilityLevel } from "@/utils/helpers";
import { aggregateWeeklyMetrics, aggregateMonthlyMetrics } from "@/utils/aggregate";
import ExportControls from "./ExportControls";

interface CalendarProps {
  selectedMetrics: string[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedMetrics }) => {
  const {
    currentMonth,
    setMetricsMap,
    setVolatilityMap,
    viewMode,
    metrics,
    setMetrics,
    selectedDate,
    setSelectedDate,
    selectedVolatility,
  } = useCalendar();
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const { marketData, loading, error } = useMarketData();

  const filteredMarketData = useMemo(() => {
    if (!marketData) return [];
    return marketData.filter(item => {
      if (selectedVolatility !== 'all') {
        const volatilityLevel = getVolatilityLevel(item.volatility);
        if (volatilityLevel !== selectedVolatility) return false;
      }
      if (selectedMetrics.length > 0) {
        const hasSelectedMetrics = selectedMetrics.some(metric => {
          switch (metric) {
            case 'volatility':
              return item.volatility !== undefined && item.volatility !== null;
            case 'liquidity':
              return item.volume !== undefined && item.volume !== null;
            case 'performance':
              return item.performance !== undefined && item.performance !== null;
            default:
              return false;
          }
        });
        if (!hasSelectedMetrics) return false;
      }
      return true;
    });
  }, [marketData, selectedVolatility, selectedMetrics]);

  const rangeSummary = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const start = rangeStart.getTime();
    const end = rangeEnd.getTime();
    const rangeData = filteredMarketData.filter(entry => {
      const time = new Date(entry.date).getTime();
      return time >= start && time <= end;
    });
    const totalVolume = rangeData.reduce((sum, d) => sum + (d.volume || 0), 0);
    const avgVolatility = rangeData.reduce((sum, d) => sum + (d.volatility || 0), 0) / (rangeData.length || 1);
    const avgPerformance = rangeData.reduce((sum, d) => sum + (d.performance || 0), 0) / (rangeData.length || 1);
    const totalLiquidity = rangeData.reduce((sum, d) => sum + (d.liquidity || 0), 0);
    return {
      count: rangeData.length,
      totalVolume,
      avgVolatility: avgVolatility.toFixed(2),
      avgPerformance: avgPerformance.toFixed(2),
      totalLiquidity,
    };
  }, [rangeStart, rangeEnd, filteredMarketData]);

  const { filteredData, aggregatedData } = useMemo(() => {
    if (!filteredMarketData || !selectedDate) return { filteredData: [], aggregatedData: [] };
    const currentDate = selectedDate;
    let filtered: any[] = [];
    let aggregated: any[] = [];

    switch (viewMode) {
      case "daily":
        filtered = filteredMarketData.filter(item =>
          item.date.getDate() === currentDate.getDate() &&
          item.date.getMonth() === currentDate.getMonth() &&
          item.date.getFullYear() === currentDate.getFullYear()
        );
        break;
      case "weekly": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        filtered = filteredMarketData.filter(item =>
          isWithinInterval(item.date, { start: weekStart, end: weekEnd })
        );
        const weeklyData = aggregateWeeklyMetrics(
          filteredMarketData.filter(item =>
            isWithinInterval(item.date, {
              start: startOfMonth(weekStart),
              end: endOfMonth(weekEnd),
            })
          )
        );
        aggregated = weeklyData.filter(week =>
          isWithinInterval(currentDate, { start: week.periodStart, end: week.periodEnd })
        );
        break;
      }
      case "monthly":
      default: {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        filtered = filteredMarketData.filter(item =>
          isWithinInterval(item.date, { start: monthStart, end: monthEnd })
        );
        aggregated = aggregateMonthlyMetrics(
          filteredMarketData.filter(item => item.date.getFullYear() === currentDate.getFullYear())
        );
        aggregated = aggregated.filter(month =>
          month.periodStart.getMonth() === currentDate.getMonth() &&
          month.periodStart.getFullYear() === currentDate.getFullYear()
        );
        break;
      }
    }
    return { filteredData: filtered, aggregatedData: aggregated };
  }, [filteredMarketData, viewMode, selectedDate]);

  useEffect(() => {
    if (filteredData.length > 0) {
      const tempVolatility = new Map<string, VolatilityLevel>();
      const tempMetrics = new Map<string, any>();
      filteredData.forEach(item => {
        const dateKey = item.date.toDateString();
        tempVolatility.set(dateKey, getVolatilityLevel(item.volatility));
        tempMetrics.set(dateKey, {
          open: item.open,
          close: item.close,
          volume: item.volume,
          volatility: item.volatility,
          performance: item.performance,
          aggregated: aggregatedData[0] || null,
        });
      });
      setVolatilityMap(tempVolatility);
      setMetricsMap(tempMetrics);
      setMetrics(filteredData);
    }
  }, [filteredData, aggregatedData, setVolatilityMap, setMetricsMap, setMetrics]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  useEffect(() => {
    if (viewMode === "daily") {
      setSelectedDate(new Date());
    }
  }, [viewMode]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  useEffect(() => {
    if (filteredMarketData && filteredMarketData.length > 0) {
      const tempVolatility = new Map<string, VolatilityLevel>();
      const tempMetrics = new Map<string, any>();
      const tempMetricsConverted = new Map<string, any>();
      filteredMarketData.forEach(data => {
        const dateKey = data.date.toDateString();
        tempVolatility.set(dateKey, getVolatilityLevel(data.volatility));
        tempMetrics.set(dateKey, data);
        tempMetricsConverted.set(dateKey, {
          open: data.open.toString(),
          close: data.close.toString(),
          volume: data.volume.toString(),
          volatility: data.volatility,
        });
      });
      setVolatilityMap(tempVolatility);
      setMetrics(Array.from(tempMetrics.values()));
      setMetricsMap(tempMetricsConverted);
    } else {
      setVolatilityMap(new Map());
      setMetrics([]);
      setMetricsMap(new Map());
    }
  }, [filteredMarketData, setMetrics, setMetricsMap, setVolatilityMap]);

  const allDays = useMemo(() => {
    const days = [];
    let current = new Date(startDate);
    if (viewMode === "monthly") {
      while (current <= endDate) {
        days.push(new Date(current));
        current = addDays(current, 1);
      }
    } else if (viewMode === "weekly") {
      const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });
      current = new Date(weekStart);
      while (current <= weekEnd) {
        days.push(new Date(current));
        current = addDays(current, 1);
      }
    } else {
      const dayToShow = selectedDate || currentMonth;
      days.push(dayToShow);
    }
    return days;
  }, [startDate, endDate, viewMode, currentMonth, selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading market data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No market data available for the selected period.
      </div>
    );
  }

  const handleDateClick = (clickedDate: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clickedDate);
      setRangeEnd(null);
    } else if (rangeStart && !rangeEnd) {
      if (clickedDate < rangeStart) {
        setRangeStart(clickedDate);
      } else {
        setRangeEnd(clickedDate);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white rounded-lg shadow-sm" id="calendar-container">
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4">
        <CalendarHeader />
      </div>

      <div className="flex-1 overflow-auto p-2 sm:p-4">
        <div id="export-area" className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + selectedDate?.toDateString()}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-7 gap-2 w-full min-w-[360px]"
            >
              {viewMode !== "daily" &&
                ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                  <div
                    key={day}
                    className="text-xs font-medium text-center py-3 text-gray-500 uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}

              {allDays.map(day => {
                const dateKey = day.toDateString();
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isTodayDate = isToday(day);
                const hasData = filteredData.some(item => isSameDay(item.date, day));
                const isInRange = rangeStart && rangeEnd && day >= rangeStart && day <= rangeEnd;
                const isSelectedStart = rangeStart && day.getTime() === rangeStart.getTime();
                const isSelectedEnd = rangeEnd && day.getTime() === rangeEnd.getTime();

                return (
                  <div
                    key={dateKey}
                    className={clsx("relative transition-colors duration-150 group", {
                      "col-span-7 w-full min-h-[120px] sm:min-h-[160px]": viewMode === "daily",
                      "min-h-[80px] sm:min-h-[100px] rounded-md overflow-visible": viewMode !== "daily",
                      "opacity-60": !isCurrentMonth && viewMode !== "daily",
                      "cursor-pointer": !isSelected && viewMode !== "daily",
                      "bg-yellow-300": isInRange,
                      "border-l-4 border-blue-500": isSelectedStart,
                      "border-r-4 border-blue-500": isSelectedEnd,
                    })}
                    onClick={() => handleDateClick(day)}
                  >
                    <CalendarCell
                      day={day}
                      isCurrentMonth={isCurrentMonth}
                      isSelected={isSelected}
                      isDayToday={isTodayDate}
                      onClick={() => handleDateClick(day)}
                      metrics={filteredData.find(item => isSameDay(item.date, day))}
                      viewMode={viewMode}
                      hasData={hasData}
                    />
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {rangeStart && rangeEnd && rangeSummary && (
        <div className="p-4 bg-white shadow rounded mt-4 text-sm text-gray-700">
          <div>
            <strong>{rangeStart.toDateString()}</strong> to <strong>{rangeEnd.toDateString()}</strong>
          </div>
          <div className="mt-2 flex flex-row flex-wrap justify-between">
            <div>
            Data points: <strong>{rangeSummary.count}</strong><br />
            {selectedMetrics.includes("volatility") && (
              <>Avg Volatility: <strong>{rangeSummary.avgVolatility}</strong><br /></>
            )}
            {selectedMetrics.includes("liquidity") && (
              <>Total Liquidity: <strong>{rangeSummary.totalLiquidity.toLocaleString()}</strong><br /></>
            )}
            {selectedMetrics.includes("performance") && (
              <>Avg Performance: <strong>{rangeSummary.avgPerformance}</strong><br /></>
            )}
            {selectedMetrics.includes("liquidity") && selectedMetrics.length === 1 && (
              <>Total Volume: <strong>{rangeSummary.totalVolume.toLocaleString()}</strong><br /></>
            )}
            </div>
            <div>
            <button
            onClick={() => {
              setRangeStart(null);
              setRangeEnd(null);
            }}
            className="mt-10 w-full sm:w-auto px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-500 rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition duration-200 text-center"
          >
            Clear Selection
          </button>
          </div>
          </div>
          

        </div>
      )}

      <ExportControls
        data={filteredMarketData}
        elementId="export-area"
        fileName="market-data"
        className="your-custom-classes"
      />
    </div>
  );
};

export default Calendar;
