# Arbitrage-Tracker: Effectful Architecture Deep-Dive

This project implements a high-frequency stock arbitrage monitoring system. The core architectural paradigm is **Effectful Programming**, where side effects are treated as first-class values to ensure the system is resilient, concurrent, and resource-safe.

## 1. I/O Boundary (Effect Inventory)
The system manages a complex boundary of asynchronous and non-deterministic operations:
* **Parallel Network I/O:** Simultaneously polling 4 distinct market venues (NYSE, NASDAQ, IEX, ARCA).
* **Resource Management:** Managing a long-running HTTP Server lifecycle (Start/Stop/Cleanup).
* **Persistence:** Sequential appending of trade signals to a local `trades.log` file.
* **Time & Scheduling:** A 1000ms "heartbeat" loop managed via the `Schedule` and `Duration` modules.
* **Process Control:** Automatically launching the system's default browser using an external process effect.

## 2. Effect Definitions & Composition
* **Service Abstraction:** I used `Context.Tag` to define `StockExchangeService` and `FileService`. This allows us to swap the "Simulated" implementations for "Real API" implementations without changing a single line of business logic.
* **Concurrency:** We utilize `Effect.all` with `{ concurrency: "unbounded" }`. This ensures that all 4 price fetches happen in parallel, satisfying the requirement for explicit concurrency control.
* **Fault Tolerance:** Every network effect is composed with `.pipe(Effect.timeout(...), Effect.retry(...))`. This prevents a single lagging exchange from blocking the entire monitoring pipeline.
* **Resource Scoping:** The HTTP server is wrapped in `Effect.acquireRelease`. This ensures that if the program is interrupted (Ctrl+C), the server port is closed cleanly, preventing "Address already in use" errors.

## 3. Pure Core (The Deterministic Engine)
The "inside" of the system is a pure computation that identifies price divergence.
* **Logic:** It accepts an array of `StockPrice` objects and identifies the `Max` and `Min` spread.
* **Purity:** This core logic has no knowledge of the UI, the Disk, or the Network. It is a mathematical transformation that turns "Market Observations" into "Arbitrage Signals."

## 4. Runtime Configuration
* **Environment:** TypeScript (ESM)
* **Library:** `Effect` (v3.x)
* **Interpreter:** The entire application is composed into a single `runnable` effect and executed via `Effect.runPromise` at the program's edge.