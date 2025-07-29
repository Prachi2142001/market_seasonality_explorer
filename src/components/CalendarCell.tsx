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
import MiniChart from "./MiniChart";

const getColorByVolatility = (level: string) => {
  switch (level) {
    case "low":
      return "bg-green-300 sm:bg-green-300 lg:bg-green-300";
    case "medium":
      return "bg-amber-300 sm:bg-amber-300 lg:bg-amber-300";
    case "high":
      return "bg-red-400 sm:bg-red-400 lg:bg-red-400";
    default:
      return "bg-gray-200 sm:bg-gray-200 lg:bg-gray-200";
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
  viewMode?: 'daily' | 'weekly' | 'monthly';
  hasData?: boolean;
};

const CalendarCell: React.FC<Props> = ({
  day,
  isCurrentMonth,
  isSelected,
  isDayToday,
  onClick,
  metrics,
  viewMode = 'daily'
}) => {

  const { openModal, calendarData } = useModal();
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

  const cellMetrics = metrics || metricsMap.get(key);
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
    if (!cellMetrics) return null;
    const open = typeof cellMetrics.open === 'string' ? parseFloat(cellMetrics.open) : cellMetrics.open;
    const close = typeof cellMetrics.close === 'string' ? parseFloat(cellMetrics.close) : cellMetrics.close;
    if (close > open)
      return <UpArrow className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-700 flex-shrink-0" />;
    if (close < open)
      return <DownArrow className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-700 flex-shrink-0" />;
    return <NeutralDash className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-600 flex-shrink-0" />;
  };

  const renderVolumeDot = () => {
    if (!cellMetrics || !cellMetrics.volume) return null;
    const volumeStr =
      typeof cellMetrics.volume === "string"
        ? cellMetrics.volume.replace("B", "")
        : String(cellMetrics.volume);
    const volumeNum = parseFloat(volumeStr);

    let sizeClass = "w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2";
    if (volumeNum > 3) sizeClass = "w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4";
    else if (volumeNum > 1.5) sizeClass = "w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3";

    return (
      <div
        title={`Volume: ${cellMetrics.volume}`}
        className={`absolute bottom-1 right-1 xs:bottom-1.5 xs:right-1.5 sm:bottom-2 sm:right-2 rounded-full bg-blue-600 ${sizeClass} flex items-center justify-center`}
      />
    );
  };

  const renderVolatilityRangeBar = () => {
    if (!cellMetrics?.volatilityRange) return null;

    const range = cellMetrics.volatilityRange;
    const normalized = Math.min(100, Math.max(0, range));
    const barHeight = `${Math.min(100, normalized)}%`;

    return (
      <div 
        className="absolute left-0.5 bottom-0.5 w-1 xs:left-1 xs:bottom-1 xs:w-1.5 sm:left-1 sm:bottom-1 sm:w-1.5 lg:w-2 bg-purple-500 rounded"
        style={{ height: barHeight }}
        title={`Intraday Range: ${range.toFixed(2)}%`}
      />
    );
  };

  const renderLiquidityOverlay = () => {
    if (!cellMetrics || !cellMetrics.liquidity) return null;
    const liquidityValue = cellMetrics.liquidity;

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
        className={`absolute inset-0 rounded-sm xs:rounded sm:rounded-md pointer-events-none ${gradient}`}
      />
    );
  };

  let background: string | undefined;
  const liquidityValue = cellMetrics?.liquidity;

  if (typeof liquidityValue === "number") {
    const normalizedLiquidity = Math.min(1, Math.max(0, liquidityValue / 100));
    background = `linear-gradient(to bottom, rgba(34, 197, 94, ${normalizedLiquidity}) 0%, transparent 100%)`;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setFocusedDate(key);

    if (cellMetrics) {
      const chartData = calendarData?.filter((entry) => entry.date <= key)
        .slice(-10);
      const modalContent = (
        <div className="p-3 sm:p-4 lg:p-6 max-w-full overflow-hidden">
          <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg">
            {format(day, 'EEEE, MMMM d, yyyy')}
          </h4>
          <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 min-w-0 flex-shrink-0 mr-2">Open:</span>
              <span className="font-medium truncate">${cellMetrics.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 min-w-0 flex-shrink-0 mr-2">Close:</span>
              <span className="font-medium truncate">${cellMetrics.close}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 min-w-0 flex-shrink-0 mr-2">Volume:</span>
              <span className="font-medium truncate">{cellMetrics.volume}</span>
            </div>
            {cellMetrics.volatility !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 min-w-0 flex-shrink-0 mr-2">Volatility:</span>
                <span className="font-medium truncate">{
                  typeof cellMetrics.volatility === 'number'
                    ? `${cellMetrics.volatility.toFixed(2)}%`
                    : cellMetrics.volatility
                }</span>
              </div>
            )}
            {(cellMetrics.performance !== undefined && cellMetrics.performance !== null) ? (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 min-w-0 flex-shrink-0 mr-2">Performance:</span>
                <span className={`font-medium truncate ${cellMetrics.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cellMetrics.performance >= 0 ? '↑' : '↓'} {Math.abs(Number(cellMetrics.performance)).toFixed(2)}%
                </span>
              </div>
            ) : null}
            {cellMetrics.volatilityRange !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 min-w-0 flex-shrink-0 mr-2">Intraday Range:</span>
                <span className="font-medium truncate">{cellMetrics.volatilityRange.toFixed(2)}%</span>
              </div>
            )}
          </div>
          {(chartData ?? []).length > 0 && (
            <div className="mt-4 sm:mt-6 overflow-hidden">
              <MiniChart data={chartData ?? []} type="line" metric="close" />
            </div>
          )}
        </div>
      );
      openModal(modalContent, "2025-07-29");
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(key);
  };

  const handleMouseLeave = () => {
    setShowTooltip("");
  };

  const getCellSizeClasses = () => {
    if (viewMode === 'daily') {
      return "h-32 xs:h-40 sm:h-48 lg:h-56 xl:h-64 w-full";
    }
    return "h-12 xs:h-14 sm:h-16 md:h-20 lg:h-24 aspect-square";
  };

  const getDateNumberClasses = () => {
    if (viewMode === 'daily') {
      return "w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-lg xs:text-xl sm:text-2xl lg:text-3xl";
    }
    return "w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-xs xs:text-sm sm:text-base";
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
        "group relative rounded-sm xs:rounded sm:rounded-md transition-all duration-200 ease-in-out shadow-sm cursor-pointer focus:outline-none overflow-hidden",
        "p-0.5 xs:p-1 sm:p-1.5 md:p-2",
        "text-xs xs:text-sm sm:text-base",
        getCellSizeClasses(),
        getColorByVolatility(volatility),
        isCurrentMonth ? "text-black" : "text-gray-400 bg-gray-50",
        isDayToday && "ring-1 xs:ring-2 ring-blue-400 font-bold shadow-md",
        (isFocused || focusedDate === key) && "ring-2 xs:ring-2 sm:ring-2 ring-blue-500 ring-offset-1 xs:ring-offset-2 z-20 shadow-lg",
        !isCurrentMonth && "opacity-60",
        "hover:shadow-md hover:scale-105 transform transition-transform"
      )}
      style={background ? { background } : undefined}
    >
      <div className="absolute inset-0 flex flex-col p-0.5 xs:p-1 sm:p-1.5 md:p-2">
        <div className="flex justify-between items-start w-full">
          <div
            className={clsx(
              "flex items-center justify-center font-medium flex-shrink-0",
              getDateNumberClasses(),
              isDayToday
                ? "bg-blue-100 border-1 xs:border-2 border-blue-500 rounded-full font-bold text-blue-700 shadow-sm"
                : viewMode === 'daily' 
                ? "text-gray-800 font-bold" 
                : "text-gray-700 font-semibold"
            )}
          >
            {formattedDate}
          </div>
          <div className="flex-shrink-0 ml-1">
            {metrics && renderPerformanceIcon()}
          </div>
        </div>

        {viewMode === 'daily' && cellMetrics && (
          <div className="flex-1 mt-2 xs:mt-3 sm:mt-4 space-y-1 xs:space-y-2 text-xs xs:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Open:</span>
              <span className="font-medium">${cellMetrics.open}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Close:</span>
              <span className="font-medium">${cellMetrics.close}</span>
            </div>
            {cellMetrics.volume && (
              <div className="flex justify-between">
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium truncate">{cellMetrics.volume}</span>
              </div>
            )}
            {cellMetrics.volatility !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Volatility:</span>
                <span className="font-medium">
                  {typeof cellMetrics.volatility === 'number'
                    ? `${cellMetrics.volatility.toFixed(1)}%`
                    : cellMetrics.volatility}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {cellMetrics && (
        <>
          {renderLiquidityOverlay()}
          {renderVolatilityRangeBar()}
          <Tooltip metrics={cellMetrics} />
          {renderVolumeDot()}
        </>
      )}
    </div>
  );
};

export default CalendarCell;