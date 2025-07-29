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
  const { selectedTimeframe } = useCalendar();

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
      <div className="flex flex-col items-center justify-center h-64 sm:h-80 lg:h-96 px-4">
        <Spinner className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500" />
        <span className="ml-2 mt-4 text-sm sm:text-base text-gray-600 text-center">Loading market data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Alert variant="destructive" className="max-w-full">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertTitle className="text-sm sm:text-base">Error loading data</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm mt-1">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96 text-gray-500 px-4">
        <p className="text-sm sm:text-base text-center">No market data available for the selected period.</p>
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
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-2 sm:p-4">
        <CalendarHeader />
      </div>

      <div className="flex-1 overflow-auto p-1 sm:p-2 lg:p-4">
        <div id="export-area" className="w-full overflow-x-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + selectedDate?.toDateString()}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
              className={clsx("w-full grid grid-cols-7 gap-1 sm:gap-2 min-w-[300px] sm:min-w-[400px] lg:min-w-[600px]")}
            >
              {viewMode !== "daily" &&
                ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                  <div
                    key={day}
                    className="text-xs sm:text-sm font-medium text-center py-2 sm:py-3 text-gray-500 uppercase tracking-wider"
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.substring(0, 1)}</span>
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
                    className={clsx("relative transition-colors duration-150 group min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] rounded-md overflow-visible", {
                      "opacity-60": !isCurrentMonth && viewMode !== "daily",
                      "cursor-pointer": !isSelected && viewMode !== "daily",
                      "bg-yellow-300": isInRange,
                      "border-l-2 sm:border-l-4 border-blue-500": isSelectedStart,
                      "border-r-2 sm:border-r-4 border-blue-500": isSelectedEnd,
                      "col-span-7 flex justify-center items-center": viewMode === "daily"
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
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 border-t border-gray-200 mx-2 sm:mx-4 lg:mx-6 mb-2 sm:mb-4 lg:mb-6 rounded-lg shadow-sm">
          <div className="mb-3 sm:mb-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Date Range Summary</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              <strong>{rangeStart.toDateString()}</strong> to <strong>{rangeEnd.toDateString()}</strong>
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <p className="text-xs text-gray-500">Data Points</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{rangeSummary.count}</p>
            </div>
            
            {selectedMetrics.includes("volatility") && (
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-500">Avg Volatility</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">{rangeSummary.avgVolatility}</p>
              </div>
            )}
            
            {selectedMetrics.includes("liquidity") && (
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-500">Total Liquidity</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">{rangeSummary.totalLiquidity.toLocaleString()}</p>
              </div>
            )}
            
            {selectedMetrics.includes("performance") && (
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-500">Avg Performance</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">{rangeSummary.avgPerformance}</p>
              </div>
            )}
            
            {selectedMetrics.includes("liquidity") && selectedMetrics.length === 1 && (
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-500">Total Volume</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">{rangeSummary.totalVolume.toLocaleString()}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                setRangeStart(null);
                setRangeEnd(null);
              }}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 hover:text-indigo-800 transition-colors duration-200 border border-indigo-200"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-3 sm:p-4 lg:p-6">
        <ExportControls
          data={filteredMarketData}
          elementId="export-area"
          fileName="market-data"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default Calendar;