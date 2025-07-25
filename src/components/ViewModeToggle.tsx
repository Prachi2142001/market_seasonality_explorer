"use client";
import React from "react";
import { useCalendar } from "@/context/CalendarContext";
import clsx from "clsx";

// Define modes as const to get literal types
const modes = ["day", "week", "month"] as const;
type ViewMode = typeof modes[number]; // "day" | "week" | "month"

const ViewModeToggle = () => {
  const { viewMode, setViewMode } = useCalendar();

  return (
    <div className="flex justify-center mb-4 space-x-2">
      {modes.map((mode) => (
        <button
          key={mode}
          className={clsx(
            "px-4 py-1 rounded-full text-sm font-medium border",
            viewMode === mode
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          )}
          onClick={() => setViewMode(mode)}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default ViewModeToggle;
