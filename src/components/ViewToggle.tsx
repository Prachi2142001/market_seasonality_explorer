"use client";
import React from "react";
import { useCalendar } from "@/context/CalendarContext";
import clsx from "clsx";

const modes = ["daily", "weekly", "monthly"] as const;

const ViewToggle = () => {
  const { viewMode, setViewMode } = useCalendar();

  return (
    <div className="flex justify-center space-x-2 mb-4">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={clsx(
                      "px-4 py-1 rounded-full text-sm font-medium border",
            viewMode === mode
                ? "bg-blue-600 text-white border-blue-700"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
