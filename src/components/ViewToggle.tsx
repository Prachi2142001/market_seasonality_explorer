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
            "px-3 py-1 rounded-md font-medium capitalize border",
            viewMode === mode
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-200"
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
