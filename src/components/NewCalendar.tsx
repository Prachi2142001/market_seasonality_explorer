"use client";

import React, { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  format,
  isToday,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { useCalendar } from "@/context/CalendarContext";
import { useMarketData } from "@/context/MarketDataContext";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { getVolatilityLevel } from "@/utils/helpers";
import { aggregateWeeklyMetrics, aggregateMonthlyMetrics } from "@/utils/aggregate";
import Modal from "./Modal";

const Calendar: React.FC = () => {
  const { currentMonth, setCurrentMonth, viewMode, metrics, selectedDate, setSelectedDate } = useCalendar();
  const { marketData, loading, error } = useMarketData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  // Navigation handlers
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  // Handle cell click
  const handleCellClick = (day: Date) => {
    setSelectedDate(day);
    const dayMetrics = metrics.find(m => isSameDay(m.date, day));
    
    if (dayMetrics) {
      setModalContent(
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">
            {format(day, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-2">
            <p>Volatility: {dayMetrics.volatility.toFixed(2)}</p>
            <p>Performance: {dayMetrics.performance.toFixed(2)}%</p>
            <p>Volume: {dayMetrics.volume}</p>
          </div>
        </div>
      );
      setIsModalOpen(true);
    }
  };

  // Generate days for the current view
  const days = useMemo(() => {
    const daysArray: Date[] = [];
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'monthly') {
      startDate = startOfMonth(currentMonth);
      endDate = endOfMonth(currentMonth);
      
      // Add days from previous month to fill the first week
      const startDay = startDate.getDay();
      const prevMonthEnd = addDays(startDate, -1);
      const prevMonthStart = addDays(prevMonthEnd, -startDay);
      
      for (let d = new Date(prevMonthStart); d <= prevMonthEnd; d = addDays(d, 1)) {
        daysArray.push(new Date(d));
      }
      
      // Add days of current month
      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        daysArray.push(new Date(d));
      }
      
      // Add days from next month to fill the last week
      const endDay = endDate.getDay();
      const nextMonthStart = addDays(endDate, 1);
      const nextMonthEnd = addDays(nextMonthStart, 6 - endDay);
      
      for (let d = new Date(nextMonthStart); d <= nextMonthEnd; d = addDays(d, 1)) {
        daysArray.push(new Date(d));
      }
    } else if (viewMode === 'weekly') {
      // For weekly view, show the week containing the selected date or current date
      const current = selectedDate || currentMonth;
      const weekStart = startOfWeek(current, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(current, { weekStartsOn: 0 });
      
      for (let d = new Date(weekStart); d <= weekEnd; d = addDays(d, 1)) {
        daysArray.push(new Date(d));
      }
    } else {
      // For daily view, show only the selected day or today
      const dayToShow = selectedDate || currentMonth;
      daysArray.push(new Date(dayToShow));
    }

    return daysArray;
  }, [currentMonth, viewMode, selectedDate]);

  // Loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading market data: {error}
        </AlertDescription>
      </Alert>
    );
  }
  if (!metrics.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No market data available for the selected period.
      </div>
    );
  }

  // Calendar header with navigation
  const CalendarHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={previousMonth}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          &lt;
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={nextMonth}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Next month"
        >
          &gt;
        </button>
        <button
          onClick={resetToToday}
          className="ml-2 text-sm text-blue-600 hover:underline"
        >
          Today
        </button>
      </div>
      <div className="flex space-x-2">
        <span className="text-sm text-gray-500">
          {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader />
      
      <div className="grid grid-cols-7 gap-1 flex-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-medium text-sm py-2">
            {day}
          </div>
        ))}

        {/* Calendar cells */}
        {days.map((day, i) => {
          const dateKey = day.toISOString().split('T')[0];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDaySelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isDayToday = isToday(day);
          
          const dayMetrics = metrics.find(m => isSameDay(m.date, day));
          const volatility = dayMetrics?.volatility || 0;
          const volatilityLevel = getVolatilityLevel(volatility);
          const performance = dayMetrics?.performance || 0;

          return (
            <div
              key={i}
              className={clsx(
                'p-2 border rounded cursor-pointer hover:bg-gray-50',
                !isCurrentMonth && 'text-gray-400',
                isDaySelected && 'ring-2 ring-blue-500',
                isDayToday && 'font-bold',
                {
                  'bg-green-50': volatilityLevel === 'low',
                  'bg-yellow-50': volatilityLevel === 'medium',
                  'bg-red-50': volatilityLevel === 'high',
                }
              )}
              onClick={() => handleCellClick(day)}
            >
              <div className="text-right">
                <div className="text-sm">{format(day, 'd')}</div>
                {dayMetrics && (
                  <div className="text-xs mt-1">
                    <div className={performance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {performance >= 0 ? '↑' : '↓'} {Math.abs(performance).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default Calendar;
