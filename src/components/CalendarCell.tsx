"use client";
import React, { useRef, useEffect } from "react";
import clsx from "clsx";
import { format, isSameMonth, isToday } from "date-fns";
import { useCalendar } from "@/context/CalendarContext";
import Tooltip from "./Tooltip";

const getColorByVolatility = (level: string) => {
  switch (level) {
    case "low":
      return "bg-green-300";
    case "medium":
      return "bg-amber-300";
    case "high":
      return "bg-red-400";
    default:
      return "";
  }
};

type Props = {
  day: Date;
};

const CalendarCell: React.FC<Props> = ({ day }) => {
  const {
    metricsMap,
    volatilityMap,
    focusedDate,
    setFocusedDate,
    setShowTooltip,
    cellRefs,
    openModal,
  } = useCalendar();

  const key = day.toDateString();
  const formattedDate = format(day, "d");
  const isCurrent = isSameMonth(day, new Date());
  const isCurrentDay = isToday(day);
  const isFocused = focusedDate === key;

  const volatility = volatilityMap.get(key) ?? "low";
  const metrics = metricsMap.get(key);

  const cellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cellRef.current) {
      cellRefs.current.set(key, cellRef.current);
    }
    return () => {
      cellRefs.current.delete(key);
    };
  }, [key, cellRefs]);

  useEffect(() => {
    if (isFocused && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentDate = new Date(key);
    const refMap = cellRefs.current;

    const navigate = (newDate: Date) => {
      const newKey = newDate.toDateString();
      if (refMap.has(newKey)) {
        setFocusedDate(newKey);
      }
    };

    switch (e.key) {
      case "ArrowUp":
        navigate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
        break;
      case "ArrowDown":
        navigate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
        break;
      case "ArrowLeft":
        navigate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
        break;
      case "ArrowRight":
        navigate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
        break;
      case "Enter":
        setShowTooltip(key);
        break;
      case "Escape":
        setFocusedDate(null);
        break;
    }
  };

  return (
    <div
      tabIndex={0}
      ref={cellRef}
      onClick={() => {
        setFocusedDate(key);
        setShowTooltip(""); 
        if (metrics) {
          openModal(
            <div>
              <h2 className="text-lg font-semibold mb-2">{key}</h2>
              <p>
                <strong>Open:</strong> ${metrics.open}
              </p>
              <p>
                <strong>Close:</strong> ${metrics.close}
              </p>
              <p>
                <strong>Volume:</strong> {metrics.volume}
              </p>
              <p>
                <strong>Volatility:</strong> {metrics.volatility}
              </p>
            </div>
          );
        }
      }}
      onKeyDown={handleKeyDown}
      className={clsx(
        "border p-1 sm:p-2 text-xs sm:text-sm relative rounded-md transition duration-300 ease-in-out shadow-sm cursor-pointer group focus:outline-none aspect-square h-16 sm:h-20",
        isCurrent ? "text-black" : "text-gray-400",
        isCurrentDay &&
          "border-2 border-blue-500 font-bold ring-2 ring-blue-400",
        isFocused && "ring-2 ring-purple-600",
        getColorByVolatility(volatility)
      )}
    >
      <div className="absolute top-1 left-1 font-semibold text-sm text-black">
        {formattedDate}
      </div>
      {metrics && <Tooltip metrics={metrics} />}
    </div>
  );
};

export default CalendarCell;
