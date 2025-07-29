"use client";
import React, { useEffect, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  format,
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

const Calendar = () => {
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

  const { marketData, loading, error } = useMarketData();
  const filteredMarketData = useMemo(() => {
    if (!marketData) return [];

    if (selectedVolatility === 'all') return marketData;

    return marketData.filter(item => {
      const volatilityLevel = getVolatilityLevel(item.volatility);
      return volatilityLevel === selectedVolatility;
    });
  }, [marketData, selectedVolatility]);

  const { filteredData, aggregatedData } = useMemo(() => {
    if (!filteredMarketData || !selectedDate) return { filteredData: [], aggregatedData: [] };

    const currentDate = selectedDate;
    let filtered: any[] = [];
    let aggregated: any[] = [];

    switch (viewMode) {
      case "daily":
        filtered = filteredMarketData.filter((item) => {
          return (
            item.date.getDate() === currentDate.getDate() &&
            item.date.getMonth() === currentDate.getMonth() &&
            item.date.getFullYear() === currentDate.getFullYear()
          );
        });
        break;

      case "weekly": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

        filtered = filteredMarketData.filter((item) =>
          isWithinInterval(item.date, { start: weekStart, end: weekEnd })
        );

        const weeklyData = aggregateWeeklyMetrics(
          filteredMarketData.filter((item) =>
            isWithinInterval(item.date, {
              start: startOfMonth(weekStart),
              end: endOfMonth(weekEnd),
            })
          )
        );


        aggregated = weeklyData.filter((week) =>
          isWithinInterval(currentDate, { start: week.periodStart, end: week.periodEnd })
        );
        break;
      }

      case "monthly":
      default: {

        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);


        filtered = filteredMarketData.filter((item) =>
          isWithinInterval(item.date, { start: monthStart, end: monthEnd })
        );
        aggregated = aggregateMonthlyMetrics(
          filteredMarketData.filter((item) => item.date.getFullYear() === currentDate.getFullYear())
        );


        aggregated = aggregated.filter((month) =>
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

      filteredData.forEach((item) => {
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
  }, [
    filteredData,
    aggregatedData,
    setVolatilityMap,
    setMetricsMap,
    setMetrics,
  ]);
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

      filteredMarketData.forEach((data) => {
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white rounded-lg shadow-sm" id="calendar-container">
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4">
        <CalendarHeader />
      </div>

      <div className="flex-1 overflow-auto p-2 sm:p-4">
        <div id="export-area" className="w-full">
          <div className="grid grid-cols-7 gap-2 w-full min-w-[360px]">
            {viewMode !== "daily" && (
              ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div
                  key={day}
                  className="text-xs font-medium text-center py-3 text-gray-500 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))
            )}

            {allDays.map((day) => {
              const dateKey = day.toDateString();
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isTodayDate = isToday(day);
              const hasData = filteredData.some(item => isSameDay(item.date, day));

              return (
                <div
                  key={dateKey}
                  className={clsx("relative transition-colors duration-150 group", {
                    "col-span-7 w-full min-h-[120px] sm:min-h-[160px]": viewMode === "daily",
                    "min-h-[80px] sm:min-h-[100px] rounded-md overflow-visible": viewMode !== "daily",
                    "opacity-60": !isCurrentMonth && viewMode !== "daily",
                    "hover:bg-gray-50 cursor-pointer": !isSelected && viewMode !== "daily",
                  })}
                >
                  <CalendarCell
                    day={day}
                    isCurrentMonth={isCurrentMonth}
                    isSelected={isSelected}
                    isDayToday={isTodayDate}
                    onClick={() => setSelectedDate(day)}
                    metrics={filteredData.find(item => isSameDay(item.date, day))}
                    viewMode={viewMode}
                    hasData={hasData}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
