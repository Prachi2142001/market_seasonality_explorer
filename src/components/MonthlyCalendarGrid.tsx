
"use client";
import React from "react";
import { aggregateMonthlyMetrics } from "../utils/aggregate";
import { CalendarMetrics } from "../types";

interface MonthlyProps {
  data: CalendarMetrics[];
}

export default function MonthlyCalendarGrid({ data }: MonthlyProps) {
  const monthlyData = aggregateMonthlyMetrics(data);

  return (
    <div className="grid grid-cols-3 gap-3">
      {monthlyData.map((month, idx) => (
        <div key={idx} className="p-3 border rounded bg-gray-100">
          <div>
            {month.periodStart.toLocaleDateString()} - {month.periodEnd.toLocaleDateString()}
          </div>
          <div>Avg Volatility: {month.avgVolatility.toFixed(2)}</div>
          <div>Total Volume: {month.totalVolume}</div>
          <div>Performance: {month.performanceChange.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
