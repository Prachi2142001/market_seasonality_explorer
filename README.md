# 📈 Market Seasonality Explorer

## 🚀 Overview
Market Seasonality Explorer is an interactive React-based dashboard for visualizing historical volatility, liquidity, and performance metrics across daily, weekly, and monthly timeframes. It is designed to help users identify market patterns and make data-informed decisions.

## 🔧 Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Utilities**: date-fns, Framer Motion
- **State Management**: React Context API
- **Data**: Mocked JSON & Live Orderbook from Binance API

## 🧩 Features

### ✅ Core Features
- Custom interactive calendar (daily/weekly/monthly)
- Volatility heatmap with color gradients
- Liquidity stripes/dots within calendar cells
- Performance arrows (📈 up / 📉 down)
- Responsive & keyboard accessible
- Click-to-view modal with detailed chart
- Side Dashboard Panel with metric breakdown

### ⚠️ In Progress / Partial Features
- Date range selection (UI done, logic pending)
- Metric filters (UX placeholder present)
- Zoom functionality (planned)
- Export (PDF/CSV/Image): To be finalized
- Real Binance orderbook fetching: Connected

## 📦 How to Run Locally

```bash
git clone https://github.com/your-username/market-seasonality-explorer.git
cd market-seasonality-explorer
npm install
npm run dev
![fix the width of the cell for daily view
](image.png)