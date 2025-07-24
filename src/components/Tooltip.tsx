"use client";

import React from "react";
import { Metric } from "@/types";

type TooltipProps = {
  metrics: Metric;
};

const Tooltip: React.FC<TooltipProps> = ({ metrics }) => {
  return (
    <div
      className="absolute z-50 hidden group-hover:block bg-white text-black text-xs sm:text-sm p-2 rounded shadow-lg top-full left-1/2 transform -translate-x-1/2 mt-2 w-40 sm:w-48 whitespace-nowrap"
      role="tooltip"
    >
      <div className="flex justify-between">
        <span className="font-medium">Open:</span>
        <span>${metrics.open}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Close:</span>
        <span>${metrics.close}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Volume:</span>
        <span>{metrics.volume}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Volatility:</span>
        <span>{metrics.volatility}</span>
      </div>
    </div>
  );
};

export default Tooltip;
