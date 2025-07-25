"use client";
import React, { useEffect, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import CalendarHeader from "./CalendarHeader";
import CalendarCell from "./CalendarCell";
import { useCalendar } from "@/context/CalendarContext";
import { VolatilityLevel, CalendarMetrics, Metric } from "@/types";
import ViewToggle from "./ViewToggle";
import clsx from "clsx";
import {
  AggregatedMetrics,
  aggregateMonthlyMetrics,
  aggregateWeeklyMetrics,
} from "@/utils/aggregate";

const Calendar = () => {
  const {
    currentMonth,
    setMetricsMap,
    setVolatilityMap,
    viewMode,
    metrics,
    setMetrics,
  } = useCalendar();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  useEffect(() => {
    const tempVolatility: Map<string, VolatilityLevel> = new Map();
    const tempMetrics: Map<string, CalendarMetrics> = new Map();
    const tempMetricsConverted: Map<string, Metric> = new Map();
    const levels: VolatilityLevel[] = ["low", "medium", "high"];

    let d = new Date(startDate);

    while (d <= endDate) {
      const open = parseFloat((60000 + Math.random() * 5000).toFixed(2));
      const close = parseFloat((60000 + Math.random() * 5000).toFixed(2));
      const volume = parseFloat((Math.random() * 5).toFixed(2));
      const volatilityLevel = levels[Math.floor(Math.random() * levels.length)];
      let performance = 0;
      if (close > open) performance = 1;
      else if (close < open) performance = -1;

      const dateKey = d.toDateString();

      const metricsEntry: CalendarMetrics = {
        date: new Date(d),
        open,
        close,
        volume,
        volatility: Math.abs(open - close) / open,
        performance,
      };

      const metricEntry: Metric = {
        open: metricsEntry.open.toString(),
        close: metricsEntry.close.toString(),
        volume: metricsEntry.volume.toString(),
        volatility: volatilityLevel,
      };

      tempVolatility.set(dateKey, volatilityLevel);
      tempMetrics.set(dateKey, metricsEntry);
      tempMetricsConverted.set(dateKey, metricEntry);

      d = addDays(d, 1);
    }

    setVolatilityMap(tempVolatility);
    setMetrics(Array.from(tempMetrics.values()));
    setMetricsMap(tempMetricsConverted);
  }, [startDate.toDateString(), endDate.toDateString()]);

  const aggregatedData = useMemo<AggregatedMetrics[]>(() => {
    if (viewMode === "weekly") return aggregateWeeklyMetrics(metrics);
    if (viewMode === "monthly") return aggregateMonthlyMetrics(metrics);
    return [];
  }, [viewMode, metrics]);

  const allDays = useMemo(() => {
    const days = [];
    let d = new Date(startDate);
    while (d <= endDate) {
      days.push(new Date(d));
      d = addDays(d, 1);
    }
    return days;
  }, [startDate, endDate]);

  return (
    <>
      <ViewToggle />
      <CalendarHeader />
  
      {viewMode !== "daily" && (
        <div className="grid grid-cols-7 text-center font-semibold bg-gray-100 py-2 rounded-md mb-2 text-sm sm:text-base">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
      )}
  
      <div
        className={clsx({
          "grid grid-cols-7 gap-1 sm:gap-2":
            viewMode === "monthly" || viewMode === "weekly",
          "grid grid-cols-1": viewMode === "daily",
        })}
      >
        {viewMode === "daily" ? (
          <CalendarCell
            key={new Date().toDateString()}
            day={new Date()}
            aggregated={aggregatedData.find((d) =>
              new Date() >= d.periodStart && new Date() <= d.periodEnd
            )}
          />
        ) : viewMode === "weekly" ? (
          (() => {
            const today = new Date();
            const weekStart = startOfWeek(today);// Sunday
            return Array.from({ length: 7 }).map((_, i) => {
              const day = addDays(weekStart, i);
              const data = aggregatedData.find(
                (d) => day >= d.periodStart && day <= d.periodEnd
              );
              return (
                <CalendarCell
                  key={day.toDateString()}
                  day={day}
                  aggregated={data}
                />
              );
            });
          })()
        ) : (
          // monthly
          allDays.map((day) => {
            const data = aggregatedData.find(
              (d) => day >= d.periodStart && day <= d.periodEnd
            );
            return (
              <CalendarCell
                key={day.toDateString()}
                day={day}
                aggregated={data}
              />
            );
          })
        )}
      </div>
    </>
  );
  
};

export default Calendar;
