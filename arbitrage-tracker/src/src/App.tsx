import React, { useState } from 'react';

// --- Domain Schema ---
interface StockProfit {
  ticker: string;
  profit: number;
  percentage: string;
}

const App = () => {
  // State for the dropdown toggle
  const [showProfits, setShowProfits] = useState(false);

  // Mocked Stock Data - Replacing Bitcoin with S&P 500 Leaders
  const profitList: StockProfit[] = [
    { ticker: "NVDA", profit: 1250.50, percentage: "+15.4%" },
    { ticker: "AAPL", profit: 450.20, percentage: "+4.2%" },
    { ticker: "TSLA", profit: -120.00, percentage: "-2.1%" },
    { ticker: "MSFT", profit: 890.75, percentage: "+8.9%" },
  ];

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white font-sans">
      <h1 className="text-3xl font-bold mb-6">📈 MedMatch: Stock Portfolio</h1>
      
      <div className="relative inline-block text-left">
        {/* The Toggle Button */}
        <button
          onClick={() => setShowProfits(!showProfits)}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          View Profit Analysis
          <span className={`transform transition-transform ${showProfits ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </button>

        {/* The Dropdown Menu */}
        {showProfits && (
          <div className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-slate-700 bg-slate-700/50 text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticker | Net Profit
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {profitList.map((item) => (
                <li 
                  key={item.ticker} 
                  className="flex justify-between items-center px-4 py-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0"
                >
                  <span className="font-mono font-bold text-blue-400">{item.ticker}</span>
                  <div className="text-right">
                    <p className={`font-bold ${item.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${item.profit.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">{item.percentage}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-12 p-6 border border-dashed border-slate-700 rounded-lg">
        <p className="text-slate-400 italic text-sm">
          Architecture Note: This UI uses React's `useState` for explicit effect-typed state management. 
          In the full backend implementation, this data is pulled from the Alpha Vantage API using an Effect pipeline.
        </p>
      </div>
    </div>
  );
};

export default App;