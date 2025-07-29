"use client";
import React from "react";
import { useModal } from "@/context/ModalContext";
import MiniChart from "./MiniChart";

const Modal = () => {
  const { isOpen, closeModal, content, selectedDate, calendarData } = useModal();

  if (!isOpen) return null;

  // Get last 7 days of data or any fallback
  const chartData = calendarData?.slice(-7) || [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={closeModal}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl pointer-events-auto z-10">
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="max-h-[calc(80vh-3rem)] overflow-y-auto space-y-6">
          {/* Main dynamic content */}
          {content}

          {/* Mini Chart Section */}
          {selectedDate && chartData.length > 0 && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 text-gray-700">Price Trend (Last 7 Days)</h3>
                <MiniChart data={chartData} type="line" metric="close" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1 text-gray-700">Volume Trend (Last 7 Days)</h3>
                <MiniChart data={chartData} type="bar" metric="volume" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
