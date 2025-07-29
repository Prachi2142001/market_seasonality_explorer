# 📈 Market Seasonality Explorer

## 🚀 Overview
**Market Seasonality Explorer** is an interactive, calendar-based React dashboard that visualizes historical market patterns across different timeframes (daily, weekly, monthly). It helps users analyze metrics like volatility, liquidity, and performance using intuitive heatmaps, symbols, and chart breakdowns.

## 🔧 Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Charting**: Recharts
- **Date Utilities**: date-fns
- **Animation**: Framer Motion
- **Exporting**: html2canvas, jsPDF
- **State Management**: React Context API
- **Data Source**: Mocked JSON + Live Orderbook from Binance API
- **Testing**: Jest & React Testing Library

---

## 🧩 Features

### ✅ Core Functionalities
- Custom interactive calendar views: **Daily**, **Weekly**, **Monthly**
- Volatility **heatmap** (color-coded)
- Liquidity indicators (gradient stripes/dots inside cells)
- Performance arrows (📈 bullish / 📉 bearish)
- Clickable cells with modal chart breakdown
- Tooltip on hover for quick data insight
- Keyboard accessible navigation
- Side Dashboard panel for detailed metric breakdown
- Real-time **Binance Orderbook** data integration
- Export options (PDF/CSV/Image) – In Progress
- Zooming & Date Range Selection
- Mobile-responsive UI and touch-optimized modals

---

## 🖥️ How to Run Locally

1. Clone the repository:
```bash
git clone https://github.com/your-username/market-seasonality-explorer.git
cd market-seasonality-explorer


