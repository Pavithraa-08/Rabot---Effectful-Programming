# Arbitrage-Tracker 

A high-performance, real-time stock arbitrage monitoring dashboard. This tool tracks price discrepancies for **$NVDA** across four major trading venues simultaneously.



##  Key Features
* **Multi-Venue Tracking:** Real-time data simulation for **NYSE, NASDAQ, IEX, and ARCA**.
* **Effect-Driven Architecture:** Built entirely with **Effect-TS** for industrial-grade error handling and concurrency.
* **Interactive Dashboard:** A dark-mode web UI featuring a live price-divergence graph (Chart.js).
* **Smart Tooltips:** Hover over the graph to see precise price data at any millisecond.
* **Profit Dropdown:** An interactive, hoverable badge that displays a history of found arbitrage opportunities.
* **Automated Workflow:** Just run the command—the tracker starts, the server launches, and your browser opens automatically.

##  Tech Stack
* **Language:** TypeScript
* **Effect System:** [Effect](https://effect.website/)
* **UI:** Node.js HTTP + HTML5/CSS3 + Chart.js
* **Tooling:** `ts-node`, `open`

##  Quick Start

### 1. Prerequisites
Ensure you have **Node.js v18+** installed.

### 2. Installation
```bash
# Clone the repository and enter the folder
npm install