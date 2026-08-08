/**
 * Live FX API Service integration using open.er-api.com
 * Supports 160+ world currencies representing all 195 sovereign nations.
 * Includes local cached fallbacks, network error handling, and simulated timeouts.
 */

// Local G10/Exotics cached fallbacks used if the network goes offline
let globalRatesCache = {
  USD: 1.0,
  EUR: 0.915,
  GBP: 0.782,
  JPY: 154.45,
  AUD: 1.518,
  CAD: 1.372,
  CHF: 0.884,
  SGD: 1.341,
  HKD: 7.808,
  CNY: 7.148,
  NZD: 1.662,
  INR: 83.92,
  AED: 3.673,
  ZAR: 18.25,
  MXN: 19.34
};

let globalChangesCache = {
  EUR: 0.12,
  GBP: -0.22,
  JPY: 1.45,
  AUD: -0.65,
  CAD: 0.08,
  CHF: -0.35,
  SGD: 0.15,
  HKD: 0.02,
  CNY: -0.58,
  NZD: 0.82,
  INR: 0.05,
  AED: 0.00,
  ZAR: -1.15,
  MXN: 1.42
};

// Seeded daily changes calculator for exotics
const getDailyChange = (code) => {
  const defaults = {
    EUR: 0.12, GBP: -0.22, JPY: 1.45, AUD: -0.65, CAD: 0.08, CHF: -0.35, SGD: 0.15, HKD: 0.02, CNY: -0.58, NZD: 0.82, INR: 0.05, AED: 0.00, ZAR: -1.15, MXN: 1.42
  };
  if (defaults[code] !== undefined) {
    return parseFloat((defaults[code] + (Math.random() - 0.5) * 0.1).toFixed(2));
  }
  let seed = code.charCodeAt(0) + (code.charCodeAt(1) || 0) + (code.charCodeAt(2) || 0);
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  return parseFloat(((r - 0.5) * 2.2).toFixed(2)); // -1.1% to +1.1%
};

// Immediately invoke async function to fetch live USD rates from ExchangeRate-API
(async () => {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
    const data = await res.json();
    
    if (data && data.result === 'success' && data.rates) {
      // Re-populate global caches with 160+ currencies
      globalRatesCache = { ...data.rates };
      
      Object.keys(data.rates).forEach(curr => {
        globalChangesCache[curr] = getDailyChange(curr);
      });
    }
  } catch (err) {
    console.warn("Unable to fetch live rates from ExchangeRate API. Using G10 fallback cache.", err);
  }
})();

// Helper to simulate API network response delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get rates relative to any selected base currency synchronously from cache
 */
export const getRates = (baseCurrency) => {
  const baseRateInUSD = globalRatesCache[baseCurrency] || 1.0;
  
  const rates = {};
  const changes = {};

  Object.keys(globalRatesCache).forEach((currency) => {
    if (currency === baseCurrency) {
      rates[currency] = 1.0;
      changes[currency] = 0.0;
    } else {
      const targetRateInUSD = globalRatesCache[currency];
      rates[currency] = parseFloat((targetRateInUSD / baseRateInUSD).toFixed(5));
      changes[currency] = globalChangesCache[currency] || 0.0;
    }
  });

  return { rates, changes };
};

/**
 * Fetches dashboard operational stats with simulated latency
 */
export const fetchMarketSummary = async (baseCurrency, shouldFail = false) => {
  await sleep(1000);
  
  if (shouldFail) {
    throw new Error("Unable to connect to FX Gateway. Connection timed out.");
  }

  const baseRate = globalRatesCache[baseCurrency] || 1.0;
  let balance = 1248900 / (globalRatesCache[baseCurrency] || 1.0);

  return {
    walletBalance: {
      amount: parseFloat(balance.toFixed(2)),
      currency: baseCurrency,
      change24h: 1.25,
    },
    tradingVolume24h: {
      amount: parseFloat((balance * 12.4).toFixed(2)),
      currency: baseCurrency,
      change24h: 8.42,
    },
    activeAlerts: {
      count: 7,
      triggeredToday: 2,
    },
    avgSpread: {
      percentage: 0.015, // 1.5 bps
      status: "optimal",
    },
    marketStatus: "Active",
    apiStatus: "Connected",
    lastUpdated: new Date().toLocaleTimeString(),
  };
};

/**
 * Fetches currency pairs, sorted by changes, to return gainers and losers
 */
export const fetchGainersAndLosers = async (baseCurrency, shouldFail = false) => {
  await sleep(800);
  if (shouldFail) {
    throw new Error("Failed to load market spreads.");
  }

  const { rates, changes } = getRates(baseCurrency);
  const items = Object.keys(rates)
    .filter((currency) => currency !== baseCurrency)
    .map((currency) => ({
      pair: `${baseCurrency}/${currency}`,
      rate: rates[currency],
      change: changes[currency],
    }));

  // Sort by percentage change
  const sorted = [...items].sort((a, b) => b.change - a.change);
  
  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();

  return { gainers, losers };
};

/**
 * Fetches 7-day historical trends from live API (Frankfurter for major, seeded walk for exotics)
 */
export const fetchHistoricalTrend = async (baseCurrency, quoteCurrency, shouldFail = false) => {
  await sleep(1000);
  if (shouldFail) {
    throw new Error("Historical database is offline.");
  }

  // List of major currencies supported by Frankfurter API
  const frankfurterSupported = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'CNY', 'NZD', 'INR', 'ZAR', 'MXN'];

  if (frankfurterSupported.includes(baseCurrency) && frankfurterSupported.includes(quoteCurrency)) {
    try {
      const today = new Date();
      const prev = new Date();
      prev.setDate(today.getDate() - 10);
      
      const todayStr = today.toISOString().split('T')[0];
      const prevStr = prev.toISOString().split('T')[0];
      
      const res = await fetch(`https://api.frankfurter.app/${prevStr}..${todayStr}?from=${baseCurrency}&to=${quoteCurrency}`);
      const data = await res.json();
      
      if (data && data.rates) {
        const dates = Object.keys(data.rates).sort().slice(-7);
        const labels = [];
        const values = [];
        
        dates.forEach(d => {
          const dateObj = new Date(d);
          const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          labels.push(dayLabel);
          values.push(data.rates[d][quoteCurrency]);
        });
        
        return {
          labels,
          datasets: [
            {
              label: `${baseCurrency}/${quoteCurrency} Trend`,
              data: values,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.3,
              fill: true,
            }
          ]
        };
      }
    } catch (err) {
      console.warn("Failed to fetch historical trend. Falling back to random walk.", err);
    }
  }

  // Fallback to random walk if not supported or failed
  const { rates } = getRates(baseCurrency);
  const targetRate = rates[quoteCurrency] || 1.0;
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [];
  
  let currentVal = targetRate;
  for (let i = 0; i < 7; i++) {
    data.unshift(parseFloat(currentVal.toFixed(4)));
    const changeFactor = 1 + (Math.random() - 0.5) * 0.024;
    currentVal = currentVal * changeFactor;
  }

  return {
    labels: days,
    datasets: [
      {
        label: `${baseCurrency}/${quoteCurrency} Trend (Simulated)`,
        data: data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };
};

/**
 * Fetches recent conversion operations
 */
export const fetchRecentConversions = async (shouldFail = false) => {
  await sleep(600);
  if (shouldFail) {
    throw new Error("Recent ledger is temporarily locked.");
  }

  return [
    { id: '1', date: '10:42:15 AM', from: 'USD', to: 'EUR', amountFrom: 50000, amountTo: 45750, rate: 0.9150, status: 'Completed' },
    { id: '2', date: '09:15:30 AM', from: 'GBP', to: 'USD', amountFrom: 12000, amountTo: 15345.27, rate: 1.2787, status: 'Completed' },
    { id: '3', date: 'Yesterday', from: 'USD', to: 'JPY', amountFrom: 100000, amountTo: 15445000, rate: 154.450, status: 'Completed' },
    { id: '4', date: 'Yesterday', from: 'EUR', to: 'GBP', amountFrom: 8500, amountTo: 7261.32, rate: 0.8543, status: 'Failed' },
  ];
};
