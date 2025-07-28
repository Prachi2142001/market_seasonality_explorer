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
import { ViewMode, VolatilityLevel } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { getVolatilityLevel } from "@/utils/helpers";
import { aggregateWeeklyMetrics, aggregateMonthlyMetrics } from "@/utils/aggregate";

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
  } = useCalendar();

  const { marketData, loading, error } = useMarketData();

  // Filter and aggregate data based on view mode
  const { filteredData, aggregatedData } = useMemo(() => {
    if (!marketData || !selectedDate) return { filteredData: [], aggregatedData: [] };

    const currentDate = selectedDate;
    let filtered: any[] = [];
    let aggregated: any[] = [];

    switch (viewMode) {
      case "daily":
        // Show data for the selected date
        filtered = marketData.filter((item) => {
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

        filtered = marketData.filter((item) =>
          isWithinInterval(item.date, { start: weekStart, end: weekEnd })
        );


        const weeklyData = aggregateWeeklyMetrics(
          marketData.filter((item) =>
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


        filtered = marketData.filter((item) =>
          isWithinInterval(item.date, { start: monthStart, end: monthEnd })
        );


        aggregated = aggregateMonthlyMetrics(
          marketData.filter((item) => item.date.getFullYear() === currentDate.getFullYear())
        );


        aggregated = aggregated.filter((month) =>
          month.periodStart.getMonth() === currentDate.getMonth() &&
          month.periodStart.getFullYear() === currentDate.getFullYear()
        );
        break;
      }
    }

    return { filteredData: filtered, aggregatedData: aggregated };
  }, [marketData, viewMode, selectedDate]);

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
          // Add aggregated data for the period if available
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

  // Set initial selected date to today if not set
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  useEffect(() => {
    if (marketData && marketData.length > 0) {
      const tempVolatility = new Map<string, VolatilityLevel>();
      const tempMetrics = new Map<string, any>();
      const tempMetricsConverted = new Map<string, any>();

      marketData.forEach((data) => {
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
    }
  }, [marketData, setMetrics, setMetricsMap, setVolatilityMap]);

  // Generate all days in the current view based on viewMode
  const allDays = useMemo(() => {
    const days = [];
    let current = new Date(startDate);

    if (viewMode === "monthly") {
      // For monthly view, show all days in the month
      while (current <= endDate) {
        days.push(new Date(current));
        current = addDays(current, 1);
      }
    } else if (viewMode === "weekly") {
      // For weekly view, show only the current week
      const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });
      current = new Date(weekStart);

      while (current <= weekEnd) {
        days.push(new Date(current));
        current = addDays(current, 1);
      }
    } else {
      // For daily view, show only the selected day or today
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
    <div className="flex flex-col h-full w-full overflow-x-hidden">
      <div className="sticky top-0 bg-white z-10 shadow-sm p-4">
        <CalendarHeader />
      </div>

      <div className="flex-1 overflow-auto p-1 sm:p-2">
        <div className="grid grid-cols-7 gap-1 w-full min-w-[360px]">
          {viewMode !== "daily" && (
            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-xs sm:text-sm font-medium text-center py-1 sm:py-2 truncate">
                {day}
              </div>
            ))
          )}

          {allDays.map((day) => {
            const dateKey = day.toDateString();
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isTodayDate = isToday(day);

            return (
              <div
                key={dateKey}
                className={clsx({
                  "col-span-7 w-full h-24 sm:h-32": viewMode === "daily",
                  "h-16 sm:h-20": viewMode !== "daily",
                  "opacity-40": !isCurrentMonth && viewMode !== "daily",
                  "min-w-0 flex": true,
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
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
