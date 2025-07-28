"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { CalendarMetrics } from '@/types';

interface PriceChartProps {
  data: CalendarMetrics[];
  height?: number;
  showVolume?: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  height = 300,
  showVolume = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map((item) => ({
    date: item.date,
    price: item.close,
    open: item.open,
    high: item.high,
    low: item.low,
    volume: item.volume,
    volatility: item.volatility,
  }));

  // Format x-axis tick
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d');
  };

  return (
    <div className="w-full h-full">
      <div style={{ height: height - (showVolume ? 100 : 0) }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              width={80}
            />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), 'PP')}
              formatter={(value, name) => {
                if (name === 'price') return [`$${Number(value).toFixed(2)}`, 'Price'];
                if (name === 'volume') return [value, 'Volume'];
                return [value, name];
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorPrice)"
              name="Price"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {showVolume && (
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickMargin={10}
                width={40}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'PP')}
                formatter={(value) => [value, 'Volume']}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#82ca9d"
                dot={false}
                name="Volume"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PriceChart;