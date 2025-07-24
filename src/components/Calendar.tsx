"use client";
import React, { useEffect } from "react";
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
import { VolatilityLevel } from "@/types";

const Calendar = () => {
  const { currentMonth, setMetricsMap, setVolatilityMap } = useCalendar();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  useEffect(() => {
    const tempVolatility: Map<string, VolatilityLevel> = new Map();
    const tempMetrics = new Map<string, any>();
    let d = new Date(startDate);
    const levels: VolatilityLevel[] = ["low", "medium", "high"];

    while (d <= endDate) {
      const volatilityLevel = levels[Math.floor(Math.random() * levels.length)];
      const key = d.toDateString();
      tempVolatility.set(key, volatilityLevel);
      tempMetrics.set(key, {
        open: (60000 + Math.random() * 5000).toFixed(2),
        close: (60000 + Math.random() * 5000).toFixed(2),
        volume: (Math.random() * 5).toFixed(2) + "B",
        volatility: volatilityLevel,
      });
      d = addDays(d, 1);
    }

    setVolatilityMap(tempVolatility);
    setMetricsMap(tempMetrics);
  }, [startDate.toDateString(), endDate.toDateString()]);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(<CalendarCell key={day.toString()} day={day} />);
      day = addDays(day, 1);
    }

    rows.push(
      <React.Fragment key={day.toString()}>{days}</React.Fragment>
    );
    days = [];
  }

  return (
    <>
      <CalendarHeader />
      <div className="grid grid-cols-7 text-center font-semibold bg-gray-100 py-2 rounded-md mb-2 text-sm sm:text-base">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{rows}</div>
    </>
  );
};

export default Calendar;
