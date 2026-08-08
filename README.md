# ApexExchange - G10 Interbank Clearing Simulation Terminal

ApexExchange is a high-availability, responsive corporate treasury clearing terminal simulating interbank forex trading, multi-currency wallets, analytics charts, rate alerts configurations, and regulatory news indicators.

## 🛠️ Technology Stack
- **Framework**: [React 18.3](https://react.dev)
- **Tooling**: [Vite 5](https://vitejs.dev)
- **Icons**: [Lucide React](https://lucide.dev)
- **Charts**: [Chart.js](https://www.chartjs.org) with [react-chartjs-2](https://react-chartjs-2.js.org)
- **Styling**: Vanilla CSS Variables (supporting high-contrast Light/Dark mode toggling)
- **Data Persistence**: HTML5 LocalStorage

## 🌟 Key Features
1. **Interactive Cockpit Dashboard**: Tracks statistics cards, active watchlists, transaction histories, and mini-converters.
2. **Currency Converter Suite**: Recalculates quote rates on input. Features swaps, clipboard copying, shares, and HTML invoice slip generator downloads.
3. **Live Exchange Rates Grid**: Visual board comparing G10 and exotic bid/ask spreads. Draws deterministic SVG sparklines.
4. **Historical trends Charts**: Plots Line, Area, or Bar graphs across 7D, 30D, 90D, and 1Y walks. Exports results to CSV or canvas PNG images.
5. **Multi-Currency Comparison Matrix**: Compares up to 4 currencies simultaneously, utilizing index normalization and cross-rate correlation tables.
6. **Portfolio Asset Wallet**: Computes real-time profits, losses, and ROI percentages. Persists CRUD operations to local storage and renders allocations on Doughnut charts.
7. **Starred watchlists (Favorites)**: Star quotes to sync customized watchlist cards across cockpit dashboards.
8. **Rate Alert thresholds (Alerts)**: Configures Above/Below alerts with SMS, Push, or Email settings. Includes a **Simulate Market Tick** drift trigger simulator.
9. **Market News & policy insights**: Category filters and headline searches for financial updates. Click cards to open full text modals.
10. **Supported Sovereign registry**: Continents filters showing capitals, population values, native symbols, and trade redirects.
11. **System analytics and logs**: Displays transaction Area charts, API Bar charts, popular pair Doughnuts, and active rails telemetry latency grids.
12. **Settings & compliance profile**: editable profile details, KYC status badges, and ThemeContext togglers.

## 📁 Folder Structure
```text
currency-ex-pipe/
├── src/
│   ├── components/       # Layout, Navbar, Sidebar, Footer skeleton widgets
│   ├── context/          # ThemeContext.jsx (Light/Dark themes synchronization)
│   ├── pages/            # 15 high-fidelity pages implementing G10 dashboards
│   │   ├── About.jsx
│   │   ├── Alerts.jsx
│   │   ├── Analytics.jsx
│   │   ├── Comparison.jsx
│   │   ├── Converter.jsx
│   │   ├── Countries.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ExchangeRates.jsx
│   │   ├── Favorites.jsx
│   │   ├── HelpCenter.jsx
│   │   ├── History.jsx
│   │   ├── News.jsx
│   │   ├── Portfolio.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── utils/            # mockFxApi.js (FX gateway simulator)
│   ├── App.jsx           # Routing & context providers mapping
│   ├── index.css         # Styling system (Custom properties & animation definitions)
│   └── main.jsx          # React renderer root
├── package.json          # Dependency packages
└── README.md             # Platform overview documentation
```

## 🚀 Getting Started

### 1. Installation
Clone the repository, navigate to the folder, and run npm install:
```bash
npm install
```

### 2. Development Run
Start the Vite local development server:
```bash
npm run dev
```

The terminal will print the local url (typically `http://localhost:5173`). Open this link in your browser to start.

### 3. Production Compilation
Compile optimization bundles:
```bash
npm run build
```
The output files will be compiled inside the `/dist` directory.
