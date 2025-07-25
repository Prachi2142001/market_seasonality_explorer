"use client";
import React, { useRef, useEffect } from "react";
import clsx from "clsx";
import { format, isSameMonth, isToday } from "date-fns";
import { useCalendar } from "@/context/CalendarContext";
import Tooltip from "./Tooltip";
import UpArrow from "@/icons/UpArrow";
import DownArrow from "@/icons/DownArrow";
import NeutralDash from "@/icons/NeutralDash";
import { AggregatedMetrics } from "@/utils/aggregate";

const getColorByVolatility = (level: string) => {
  switch (level) {
    case "low":
      return "bg-green-300";
    case "medium":
      return "bg-amber-300";
    case "high":
      return "bg-red-400";
    default:
      return "bg-gray-200";
  }
};

type Props = {
  day: Date;
  aggregated?: AggregatedMetrics;
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

  const renderPerformanceIcon = () => {
    if (!metrics) return null;
    const open = parseFloat(metrics.open);
    const close = parseFloat(metrics.close);
    if (close > open)
      return <UpArrow className="w-3 h-3 sm:w-4 sm:h-4 text-green-700" />;
    if (close < open)
      return <DownArrow className="w-3 h-3 sm:w-4 sm:h-4 text-red-700" />;
    return <NeutralDash className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />;
  };

  const renderVolumeDot = () => {
    if (!metrics || !metrics.volume) return null;
    const volumeStr =
      typeof metrics.volume === "string"
        ? metrics.volume.replace("B", "")
        : String(metrics.volume);
    const volumeNum = parseFloat(volumeStr);

    let sizeClass = "w-2 h-2";
    if (volumeNum > 3) sizeClass = "w-4 h-4";
    else if (volumeNum > 1.5) sizeClass = "w-3 h-3";

    return (
      <div
        title={`Volume: ${metrics.volume}`}
        className={`absolute bottom-2 right-2 rounded-full bg-blue-600 ${sizeClass} flex items-center justify-center`}
      />
    );
  };

  const renderLiquidityOverlay = () => {
    if (!metrics || !metrics.liquidity) return null;
    const liquidityValue = metrics.liquidity;

    if (liquidityValue < 0.1) return null;

    let gradient = "";
    if (liquidityValue > 0.75) {
      gradient = "bg-gradient-to-br from-blue-200 to-blue-400 opacity-40";
    } else if (liquidityValue > 0.4) {
      gradient = "bg-gradient-to-br from-blue-100 to-blue-300 opacity-30";
    } else {
      gradient = "bg-gradient-to-br from-blue-50 to-blue-200 opacity-20";
    }

    return (
      <div
        className={`absolute inset-0 rounded-md pointer-events-none ${gradient}`}
      />
    );
  };

  let background: string | undefined;
  const liquidityValue = metrics?.liquidity;

  if (typeof liquidityValue === "number") {

    const normalizedLiquidity = Math.min(1, Math.max(0, liquidityValue / 100));

    background = `linear-gradient(to bottom, rgba(34, 197, 94, ${normalizedLiquidity}) 0%, transparent 100%)`;
  }
  return (
    <div
      tabIndex={0}
      ref={cellRef}
      onClick={() => {
        setFocusedDate(key);
        setShowTooltip(" ");
        const metrics = metricsMap.get(key);
        if (metrics) {
          openModal(
            <div className="space-y-1">
              <p className="font-semibold">{day.toDateString()}</p>
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
                <strong>Liquidity:</strong>{" "}
                {typeof metrics.liquidity === "number"
                  ? metrics.liquidity.toFixed(2)
                  : "N/A"}
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
        getColorByVolatility(volatility),
        isCurrent ? "text-black" : "text-gray-300",
        isCurrentDay &&
        "border-2 border-blue-500 font-bold ring-2 ring-blue-400",
        isFocused && "ring-2 ring-purple-600"
      )}
    >
      {/* Liquidity background gradient layer */}
      <div className="absolute inset-0 z-0" style={{ background }} />

      {/* Liquidity overlay elements (like stripes) */}
      {renderLiquidityOverlay()}

      {/* Date in top-left */}
      <div className="absolute top-1 left-1 text-[0.65rem] sm:text-sm font-semibold text-black z-10">
        {formattedDate}
      </div>

      {/* Performance arrow in top-right */}
      <div className="absolute top-1 right-1 z-10">
        {renderPerformanceIcon()}
      </div>

      {/* Volume dot */}
      <div className="absolute bottom-1 right-1  z-10">{renderVolumeDot()}</div>

      {/* Tooltip (hover layer) */}
      {metrics && <Tooltip metrics={metrics} />}
    </div>
  );
};

export default CalendarCell;
