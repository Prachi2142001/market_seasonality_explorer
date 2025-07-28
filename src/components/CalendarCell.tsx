"use client";
import React, { useRef, useEffect } from "react";
import clsx from "clsx";
import { format, isSameMonth, isToday } from "date-fns";
import { useCalendar } from "@/context/CalendarContext";
import { useModal } from "@/context/ModalContext";
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
  isCurrentMonth: boolean;
  isSelected: boolean;
  isDayToday: boolean;
  onClick: () => void;
  aggregated?: AggregatedMetrics;
  metrics?: any; 
  viewMode?: 'daily' | 'weekly' | 'monthly';  // Add this line 
};

const CalendarCell: React.FC<Props> = ({ day,
  isCurrentMonth,
  isSelected,
  isDayToday,
  onClick,  
  metrics,
  viewMode = 'daily'   }) => {
  const { openModal } = useModal();
  const {
    metricsMap,
    volatilityMap,
    focusedDate,
    setFocusedDate,
    setShowTooltip,
    cellRefs,
  } = useCalendar();

  const key = day.toDateString();
  const formattedDate = format(day, "d");
  const isCurrent = isSameMonth(day, new Date());
  const isCurrentDay = isToday(day);
  const isFocused = focusedDate === key;

  const volatility = volatilityMap.get(key) ?? "low";


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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setFocusedDate(key);
    
    if (metrics) {
      const modalContent = (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            {format(day, 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Open:</span>
              <span>${metrics.open}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Close:</span>
              <span>${metrics.close}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume:</span>
              <span>{metrics.volume}</span>
            </div>
            {metrics.volatility !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Volatility:</span>
                <span>{metrics.volatility}%</span>
              </div>
            )}
            {metrics.performance !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Performance:</span>
                <span className={metrics.performance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metrics.performance >= 0 ? '↑' : '↓'} {Math.abs(metrics.performance)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
      openModal(modalContent);
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(key);
  };

  const handleMouseLeave = () => {
    setShowTooltip("");
  };

  return (
    <div
      tabIndex={0}
      ref={cellRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      className={clsx(
        "group border p-1 sm:p-2 text-xs sm:text-sm relative ml-12 rounded-md transition duration-300 ease-in-out shadow-sm cursor-pointer focus:outline-none aspect-square h-16 sm:h-20 overflow-visible",
        getColorByVolatility(volatility),
        isCurrentMonth ? "text-black" : "text-gray-400 bg-gray-50",
        isDayToday && "border-2 border-blue-500 font-bold ring-2 ring-blue-400",
        (isFocused || focusedDate === key) && "ring-2 ring-blue-500 ring-offset-2 z-20",
        !isCurrentMonth && "opacity-60"
      )}
    >
      <div className="absolute inset-0 flex flex-col p-1">
        <div className="flex justify-between items-start">
          <button className={clsx("font-bold text-red-700", isDayToday && "text-blue-700")} onClick={() => openModal}>
            {formattedDate}
          </button>
          {metrics && renderPerformanceIcon()}
        </div>
      </div>

      {metrics && (
        <>
          {renderLiquidityOverlay()}
          <Tooltip metrics={metrics} />
          {renderVolumeDot()}
        </>
      )}
    </div>
  );
};

export default CalendarCell;
