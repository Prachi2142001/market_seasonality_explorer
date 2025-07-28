"use client";
import React from "react";
import { format, addMonths, subMonths } from "date-fns";
import { useCalendar } from "@/context/CalendarContext";

const CalendarHeader = () => {
  const { currentMonth, setCurrentMonth } = useCalendar();

  return (
    <div className="flex justify-between items-center mb-4 gap-x-4">
      <button
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
      >
        Prev
      </button>
      <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
      <button
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
      >
        Next
      </button>
    </div>
  );
};

export default CalendarHeader;
