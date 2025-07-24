"use client";
import React from "react";
import Calendar from "@/components/Calendar";
import { CalendarProvider } from "@/context/CalendarContext";

export default function Home() {
  return (
    <CalendarProvider>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-xl shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4">
            Market Seasonality Explorer
          </h1>
          <Calendar />
        </div>
      </main>
    </CalendarProvider>
  );
}
