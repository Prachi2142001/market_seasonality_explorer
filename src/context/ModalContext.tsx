"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type ModalContextType = {
  isOpen: boolean;
  content: ReactNode;
  openModal: (content: ReactNode, date?: string) => void;
  closeModal: () => void;
  selectedDate: string | null;
  calendarData?: any[];
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<any[]>([]);

  const openModal = (modalContent: ReactNode, date?: string) => {
    setContent(modalContent);
    setSelectedDate(date ?? null); 
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
    setSelectedDate(null); 
  };

  return (
    <ModalContext.Provider value={{
      isOpen, content, openModal, closeModal, selectedDate,
      calendarData,
    }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
