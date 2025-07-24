"use client";
import React, { createContext, useState, useContext, useRef } from "react";
import { CalendarState, Metric, ViewMode, VolatilityLevel } from "@/types";

type CalendarContextType = CalendarState & {
  setCurrentMonth: (date: Date) => void;
  setMetricsMap: (map: Map<string, Metric>) => void;
  setVolatilityMap: (map: Map<string, VolatilityLevel>) => void;
  setFocusedDate: (date: string | null) => void;
  cellRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  setShowTooltip: (key: string) => void;
  isModalOpen: boolean;
  modalContent: React.ReactNode;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export const CalendarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [metricsMap, setMetricsMap] = useState<Map<string, Metric>>(new Map());
  const [volatilityMap, setVolatilityMap] = useState<
    Map<string, VolatilityLevel>
  >(new Map());
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  const setShowTooltip = (key: string) => {
    const el = cellRefs.current.get(key);
    if (el) {
      el.focus();
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  return (
    <CalendarContext.Provider
      value={{
        currentMonth,
        metricsMap,
        volatilityMap,
        focusedDate,
        setCurrentMonth,
        setMetricsMap,
        setVolatilityMap,
        setFocusedDate,
        cellRefs,
        setShowTooltip,
        isModalOpen,
        modalContent,
        openModal,
        closeModal,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
};
