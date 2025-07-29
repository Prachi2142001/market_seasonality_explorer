"use client";
import React from "react";

interface FilterControlsProps {
  selectedMetrics: string[];
  setSelectedMetrics: React.Dispatch<React.SetStateAction<string[]>>;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  selectedMetrics,
  setSelectedMetrics,
}) => {
  const metrics = ["volatility", "liquidity", "performance"];

  const handleMetricChange = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6 items-center justify-start p-4 rounded-xl bg-white">
      <h4 className="font-semibold text-gray-800">Select Metrics:</h4>
      <div className="flex gap-4 flex-wrap">
        {metrics.map((metric) => (
          <label
            key={metric}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border
              ${
                selectedMetrics.includes(metric)
                  ? "bg-indigo-500 text-white border-indigo-600"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={selectedMetrics.includes(metric)}
              onChange={() => handleMetricChange(metric)}
            />
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </label>
        ))}
      </div>
    </div>
  );
};

export default FilterControls;
