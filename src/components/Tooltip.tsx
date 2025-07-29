"use client";

import React from "react";
import { Metric } from "@/types";

type TooltipProps = {
  metrics?: Metric; 
};

const formatNumber = (num: number | string | undefined, decimals = 3): string => {
  const parsed = Number(num);
  if (!num || isNaN(parsed)) return "N/A";
  return parsed.toFixed(decimals);
};

const Tooltip: React.FC<TooltipProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="absolute top-[120%] left-1/2 transform -translate-x-1/2 z-50 bg-white p-4 rounded shadow text-xs text-gray-500 w-40 sm:w-48 text-center border border-gray-200">
        Data not available
      </div>
    );
  }

  return (
    <div
      className="absolute z-50 bg-white text-black text-xs sm:text-sm p-3 rounded shadow-lg w-40 sm:w-48 whitespace-nowrap pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100"
      style={{
        top: 'calc(100% + 5px)',
        left: '50%',
        transform: 'translateX(-50%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      role="tooltip"
    >
      <div className="flex justify-between gap-2">
        <span className="font-medium">Open:</span>
        <span>${metrics.open ?? "N/A"}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="font-medium">Close:</span>
        <span>${metrics.close ?? "N/A"}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="font-medium">Volume:</span>
        <span title={metrics.volume?.toString() ?? "N/A"}>
          {formatNumber(metrics.volume)}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="font-medium">Volatility:</span>
        <span title={metrics.volatility?.toString() ?? "N/A"}>
          {formatNumber(metrics.volatility)}
        </span>
      </div>
    </div>
  );
};

export default Tooltip;
