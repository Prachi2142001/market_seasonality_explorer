"use client";
import React from "react";
import { format, addMonths, subMonths } from "date-fns";
import { useCalendar } from "@/context/CalendarContext";

const CalendarHeader = () => {
  const {
    currentMonth,
    setCurrentMonth,
    selectedTimeframe,
    setTimeframe,
  } = useCalendar();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 w-full">
      <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 px-2 sm:px-3 py-1.5 rounded transition-colors shadow-sm"
          aria-label="Previous month"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">←</span>
        </button>
        <h4 className="text-base mt-2 sm:text-xl font-semibold mx-2 text-center sm:text-left min-w-[160px] sm:min-w-[180px]">
          {format(currentMonth, "MMMM yyyy")}
        </h4>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 px-2 sm:px-3 py-1.5 rounded transition-colors shadow-sm"
          aria-label="Next month"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>
      <div className="flex justify-center sm:justify-end gap-2 w-full sm:w-auto">
        <button
          onClick={() => setTimeframe("daily")}
          className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${
            selectedTimeframe === "daily"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-label="Daily view"
        >
          <span className="hidden sm:inline">Zoom In</span>
          <span className="sm:hidden">Day</span>
        </button>
        <button
          onClick={() => setTimeframe("monthly")}
          className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${
            selectedTimeframe === "monthly"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-label="Monthly view"
        >
          <span className="hidden sm:inline">Zoom Out</span>
          <span className="sm:hidden">Month</span>
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
