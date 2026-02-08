import { Effect, Context, Schedule, Duration, Console } from "effect";
import * as fs from "node:fs/promises";
import * as http from "node:http";
import open from "open";

// --- 1. THE SERVICES ---
class StockExchangeService extends Context.Tag("StockExchangeService")<
  StockExchangeService,
  { readonly getPrice: (name: string) => Effect.Effect<{exchange: string, price: number}, Error> }
>() {}

class FileService extends Context.Tag("FileService")<
  FileService,
  { readonly saveTrade: (data: string) => Effect.Effect<void, Error> }
>() {}

// --- 2. STATE ---
let priceHistory: any[] = [];
let recentProfits: string[] = []; 
const SYMBOL = "NVDA (NVIDIA Corp)";

// --- 3. THE WORKFLOW ---
const program = Effect.gen(function* (_) {
  const exchange = yield* _(StockExchangeService);
  const file = yield* _(FileService);

  const prices = yield* _(
    Effect.all([
      exchange.getPrice("NYSE"), exchange.getPrice("NASDAQ"),
      exchange.getPrice("IEX"), exchange.getPrice("ARCA")
    ], { concurrency: "unbounded" }).pipe(
      Effect.timeout(Duration.millis(900)),
      Effect.retry(Schedule.recurs(2))
    )
  );

  const sorted = [...prices].sort((a, b) => b.price - a.price);
  const spread = ((sorted[0].price - sorted[3].price) / sorted[3].price) * 100;
  const timestamp = new Date().toLocaleTimeString();

  priceHistory.push({ time: timestamp, NYSE: prices[0].price, NASDAQ: prices[1].price, IEX: prices[2].price, ARCA: prices[3].price });
  if (priceHistory.length > 20) priceHistory.shift();

  if (spread > 0.05) { 
    const message = `[PROFIT] ${sorted[0].exchange} vs ${sorted[3].exchange} | Spread: ${spread.toFixed(3)}%`;
    recentProfits.unshift(`${timestamp}: ${message}`);
    if (recentProfits.length > 10) recentProfits.pop();
    yield* _(file.saveTrade(message));
  }
});

// --- 4. THE UI TEMPLATE ---
function getHtmlContent() {
  const profitItems = recentProfits.length === 0 
    ? '<div class="profit-item">Scanning for spreads...</div>' 
    : recentProfits.map(p => `<div class="profit-item">${p}</div>`).join('');

  return `
    <html>
      <head>
      <title>Tracker</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { background: #0b0f1a; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 30px; }
          .nav { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
          .profit-container { position: relative; display: inline-block; cursor: pointer; z-index: 100; }
          .profit-badge { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              padding: 12px 24px; border-radius: 50px; font-weight: bold; 
              box-shadow: 0 0 20px rgba(16,185,129,0.3);
          }
          .dropdown { 
              display: none; position: absolute; right: 0; top: 55px; 
              background: #1e293b; min-width: 380px; border-radius: 12px; 
              border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); padding: 10px;
          }
          .profit-container:hover .dropdown { display: block; }
          .profit-item { padding: 8px; border-bottom: 1px solid #334155; font-size: 0.8rem; color: #10b981; }
          .chart-box { background: #161e2e; padding: 25px; border-radius: 16px; border: 1px solid #1f2937; }
          h1 { margin: 0; color: #60a5fa; }
        </style>
      </head>
      <body>
        <div class="nav">
          <div><h1> Arbitrage-Tracker</h1><p style="color:#64748b">Real-time Analysis for ${SYMBOL}</p></div>
          <div class="profit-container">
            <div class="profit-badge">Total Profits Found: ${recentProfits.length}</div>
            <div class="dropdown">${profitItems}</div>
          </div>
        </div>
        <div class="chart-box"><canvas id="stockChart"></canvas></div>
        <script>
          const data = ${JSON.stringify(priceHistory)};
          const ctx = document.getElementById('stockChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: data.map(d => d.time),
              datasets: ['NYSE', 'NASDAQ', 'IEX', 'ARCA'].map(ex => ({
                label: ex, data: data.map(d => d[ex]),
                borderColor: ex === 'NYSE' ? '#60a5fa' : ex === 'NASDAQ' ? '#f472b6' : ex === 'IEX' ? '#fbbf24' : '#a78bfa',
                borderWidth: 2, tension: 0.2, pointRadius: 4, hoverRadius: 8
              }))
            },
            options: { 
                responsive: true, animation: false, 
                plugins: { 
                  tooltip: { enabled: true, mode: 'index', intersect: false },
                  legend: { labels: { color: '#f8fafc' } } 
                },
                scales: { 
                  y: { grid: { color: '#1f2937' }, ticks: { color: '#94a3b8' } }, 
                  x: { grid: { display: false } } 
                }
            }
          });
          setTimeout(() => location.reload(), 1000);
        </script>
      </body>
    </html>
  `;
}

// --- 5. RUNTIME & SERVER ---
const makeServer = Effect.gen(function* (_) {
  return yield* _(Effect.acquireRelease(
    Effect.sync(() => {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getHtmlContent());
      });
      server.listen(3000);
      return server;
    }),
    (server) => Effect.sync(() => server.close())
  ));
});

const LiveStockExchange = StockExchangeService.of({
  getPrice: (name) => Effect.succeed({ exchange: name, price: 140 + (Math.random() * 0.4) })
});

const LiveFile = FileService.of({
  saveTrade: (data) => Effect.tryPromise({
    try: () => fs.appendFile("trades.log", data + "\n"),
    catch: (e) => new Error("Disk Fail")
  })
});

const runnable = Effect.scoped(
  Effect.gen(function* (_) {
    yield* _(makeServer);
    yield* _(Effect.promise(() => open('http://localhost:3000')));
    yield* _(program.pipe(Effect.repeat(Schedule.spaced(Duration.seconds(1)))));
  })
);

Effect.runPromise(runnable.pipe(
  Effect.provideService(StockExchangeService, LiveStockExchange),
  Effect.provideService(FileService, LiveFile)
));