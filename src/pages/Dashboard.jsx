import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  fetchMarketSummary, 
  fetchGainersAndLosers, 
  fetchHistoricalTrend, 
  fetchRecentConversions, 
  getRates 
} from '../utils/mockFxApi';
import { 
  LayoutDashboard, TrendingUp, Wallet, BellRing, RefreshCw, 
  ArrowLeftRight, Star, ArrowUpRight, ArrowDownRight, Clock, 
  AlertTriangle, Check, ShieldAlert, Sparkles 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { theme } = useTheme();

  // Primary states
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulateError, setSimulateError] = useState(false);

  // Widget states
  const [summaryData, setSummaryData] = useState(null);
  const [gainersLosers, setGainersLosers] = useState({ gainers: [], losers: [] });
  const [recentConversions, setRecentConversions] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [chartQuote, setChartQuote] = useState('EUR');

  // Quick converter states
  const [convertFromAmount, setConvertFromAmount] = useState('1000');
  const [convertFromCurrency, setConvertFromCurrency] = useState('USD');
  const [convertToCurrency, setConvertToCurrency] = useState('EUR');
  const [conversionResult, setConversionResult] = useState('');

  // Starred / Watchlist items
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('apex_favorites');
    return saved ? JSON.parse(saved) : ['EUR', 'GBP', 'JPY', 'CHF'];
  });

  useEffect(() => {
    localStorage.setItem('apex_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch all dashboard data
  const loadDashboardData = async (base, errorSimulated) => {
    setLoading(true);
    setError(null);
    try {
      // Parallel requests simulating gateway sync
      const [summary, gainLos, trend, recent] = await Promise.all([
        fetchMarketSummary(base, errorSimulated),
        fetchGainersAndLosers(base, errorSimulated),
        fetchHistoricalTrend(base, chartQuote, errorSimulated),
        fetchRecentConversions(errorSimulated)
      ]);

      setSummaryData(summary);
      setGainersLosers(gainLos);
      setChartData(trend);
      setRecentConversions(recent);
      
      // Calculate initial quick conversion
      const ratesData = getRates(convertFromCurrency);
      const targetRate = ratesData.rates[convertToCurrency] || 1;
      setConversionResult((parseFloat(convertFromAmount) * targetRate).toFixed(2));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on base currency, selected quote, or simulator changes
  useEffect(() => {
    loadDashboardData(baseCurrency, simulateError);
  }, [baseCurrency, simulateError]);

  // Handle quote changes specifically for the Chart view
  useEffect(() => {
    const updateChartQuote = async () => {
      try {
        const trend = await fetchHistoricalTrend(baseCurrency, chartQuote, simulateError);
        setChartData(trend);
      } catch (err) {
        // Suppress or handle nested error within the widget scope
      }
    };
    if (summaryData) {
      updateChartQuote();
    }
  }, [chartQuote]);

  // Dynamic calculations for the converter inputs
  useEffect(() => {
    if (!loading && getRates) {
      const ratesData = getRates(convertFromCurrency);
      const targetRate = ratesData.rates[convertToCurrency] || 1;
      const amt = parseFloat(convertFromAmount);
      if (!isNaN(amt)) {
        setConversionResult((amt * targetRate).toFixed(2));
      } else {
        setConversionResult('0.00');
      }
    }
  }, [convertFromAmount, convertFromCurrency, convertToCurrency, loading]);

  // Handle Quick Currency Swapping
  const handleSwapCurrencies = () => {
    const from = convertFromCurrency;
    const to = convertToCurrency;
    setConvertFromCurrency(to);
    setConvertToCurrency(from);
  };

  // Base Currency Selector handler
  const handleBaseCurrencyChange = (newBase) => {
    setBaseCurrency(newBase);
    setConvertFromCurrency(newBase);
    // Adjust target quote default if it matches new base
    if (chartQuote === newBase) {
      setChartQuote(newBase === 'USD' ? 'EUR' : 'USD');
    }
    if (convertToCurrency === newBase) {
      setConvertToCurrency(newBase === 'USD' ? 'EUR' : 'USD');
    }
  };

  // Force manual refresh
  const handleRefresh = () => {
    loadDashboardData(baseCurrency, simulateError);
  };

  // Toggle simulate failure flag
  const handleToggleSimulateError = () => {
    const nextErrorState = !simulateError;
    setSimulateError(nextErrorState);
  };

  // Close error state and fetch successfully
  const handleRetry = () => {
    setSimulateError(false);
    loadDashboardData(baseCurrency, false);
  };

  // Add/Remove favorite currency
  const handleToggleFavorite = (currency) => {
    if (favorites.includes(currency)) {
      setFavorites(favorites.filter(c => c !== currency));
    } else {
      setFavorites([...favorites, currency]);
    }
  };

  // Chart configuration settings tailored for Light and Dark modes
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        bodyColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
        },
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans' }
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
        },
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans' }
        },
      },
    },
  };

  // Fetch lists for converter dropdowns
  const availableCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'CNH', 'NZD'];

  // 1. SKELETON RENDERER
  if (loading && !summaryData) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="skeleton-pulse skeleton-title" style={{ width: '220px' }}></div>
            <div className="skeleton-pulse skeleton-text" style={{ width: '400px' }}></div>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card" style={{ minHeight: '120px' }}>
              <div className="skeleton-pulse skeleton-title" style={{ width: '40%' }}></div>
              <div className="skeleton-pulse skeleton-text" style={{ width: '70%', height: '24px' }}></div>
              <div className="skeleton-pulse skeleton-text" style={{ width: '30%' }}></div>
            </div>
          ))}
        </div>

        <div className="dashboard-content-grid">
          <div className="widget-card" style={{ minHeight: '380px' }}>
            <div className="skeleton-pulse skeleton-title" style={{ width: '30%' }}></div>
            <div className="skeleton-pulse" style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}></div>
          </div>
          <div className="widget-card" style={{ minHeight: '380px' }}>
            <div className="skeleton-pulse skeleton-title" style={{ width: '40%' }}></div>
            <div className="skeleton-pulse skeleton-text" style={{ height: '45px', marginTop: '20px' }}></div>
            <div className="skeleton-pulse skeleton-text" style={{ height: '45px' }}></div>
            <div className="skeleton-pulse skeleton-text" style={{ height: '45px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE BOUNDARY
  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Enterprise Dashboard</h1>
          <p className="page-subtitle">Real-time overview of global currency markets, exchange operations, and wallet portfolio balances.</p>
        </div>

        <div className="error-fallback-container" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <ShieldAlert size={48} color="var(--danger)" />
          <h2 className="error-fallback-title">API Connection Timeout</h2>
          <p className="error-fallback-text">{error.message || "We encountered an issue synchronizing foreign exchange rate lists from the treasury gateway."}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="error-retry-btn" onClick={handleRetry}>
              Retry API Handshake
            </button>
            <button 
              className="error-retry-btn" 
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
              onClick={handleRefresh}
            >
              Force Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { walletBalance, tradingVolume24h, activeAlerts, avgSpread, lastUpdated, marketStatus, apiStatus } = summaryData;

  // Retrieve watchlist details
  const currencyRates = getRates(baseCurrency);

  return (
    <div>
      {/* Dynamic Rotation Class Stylesheet */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1.5s linear infinite; }
      `}</style>

      {/* Page Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Enterprise Dashboard</h1>
          <p className="page-subtitle">Last Sync: {lastUpdated || 'Offline'} UTC</p>
        </div>
        
        <div className="dashboard-header-controls">
          <button 
            className="placeholder-btn" 
            onClick={handleToggleSimulateError} 
            style={{ 
              backgroundColor: simulateError ? 'var(--accent)' : 'var(--danger)', 
              fontSize: '0.75rem', 
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {simulateError ? "Disable Error Simulator" : "Simulate API Timeout"}
          </button>

          <div className="base-select-wrapper">
            <label htmlFor="baseCurrencySelect">Base:</label>
            <select 
              id="baseCurrencySelect" 
              className="currency-select-drop"
              value={baseCurrency}
              onChange={(e) => handleBaseCurrencyChange(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <span className="badge-status active">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'inline-block' }}></span>
            API: {apiStatus}
          </span>
          
          <span className="badge-status active">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'inline-block' }}></span>
            Market: {marketStatus}
          </span>

          <button 
            className="icon-btn" 
            onClick={handleRefresh}
            title="Force API Refresh"
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 4 Dashboard Stats Cards (Animated) */}
      <div className="dashboard-stats-grid">
        {/* Wallet Balance Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Portfolio Account Value</span>
            <Wallet size={18} className="stat-card-icon" />
          </div>
          <div className="stat-card-body">
            <span className="stat-val">{baseCurrency === 'JPY' ? '¥' : baseCurrency === 'EUR' ? '€' : baseCurrency === 'GBP' ? '£' : '$'}{walletBalance.amount.toLocaleString()}</span>
            <div className="stat-card-footer">
              <span className="trend-up" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={14} /> +{walletBalance.change24h}%
              </span>
              <span style={{ color: 'var(--text-muted)' }}>vs yesterday</span>
            </div>
          </div>
        </div>

        {/* 24h Trading Volume Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Exchange Volume (24h)</span>
            <TrendingUp size={18} className="stat-card-icon" />
          </div>
          <div className="stat-card-body">
            <span className="stat-val">{baseCurrency === 'JPY' ? '¥' : baseCurrency === 'EUR' ? '€' : baseCurrency === 'GBP' ? '£' : '$'}{tradingVolume24h.amount.toLocaleString()}</span>
            <div className="stat-card-footer">
              <span className="trend-up" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={14} /> +{tradingVolume24h.change24h}%
              </span>
              <span style={{ color: 'var(--text-muted)' }}>liquidity index</span>
            </div>
          </div>
        </div>

        {/* Active Alerts Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>System Alerts Configured</span>
            <BellRing size={18} className="stat-card-icon" />
          </div>
          <div className="stat-card-body">
            <span className="stat-val">{activeAlerts.count} Pairs</span>
            <div className="stat-card-footer">
              <span className="trend-up" style={{ color: 'var(--primary)' }}>
                {activeAlerts.triggeredToday} rate events
              </span>
              <span style={{ color: 'var(--text-muted)' }}>triggered today</span>
            </div>
          </div>
        </div>

        {/* Average Bid-Ask Spread */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Average Interbank Spread</span>
            <ShieldAlert size={18} className="stat-card-icon" />
          </div>
          <div className="stat-card-body">
            <span className="stat-val">{(avgSpread.percentage * 100).toFixed(3)}%</span>
            <div className="stat-card-footer">
              <span className="trend-up" style={{ color: 'var(--accent)' }}>
                Spread: Optimal
              </span>
              <span style={{ color: 'var(--text-muted)' }}>G10 Liquidity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Exchange rate Line chart (Chart.js) and Quick Converter */}
      <div className="dashboard-content-grid">
        {/* Line Chart Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <TrendingUp size={18} color="var(--primary)" />
              Exchange Rate Trend Overview
            </div>
            
            {/* Chart Quote Currency Selector */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quote Pair:</span>
              <select 
                className="currency-select-drop"
                style={{ border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
                value={chartQuote}
                onChange={(e) => setChartQuote(e.target.value)}
              >
                {availableCurrencies
                  .filter(c => c !== baseCurrency)
                  .map(currency => (
                    <option key={currency} value={currency}>{baseCurrency}/{currency}</option>
                  ))
                }
              </select>
            </div>
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: '300px' }}>
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
            )}
          </div>
        </div>

        {/* Quick Converter Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <ArrowLeftRight size={18} color="var(--primary)" />
              Quick Converter
            </div>
          </div>

          <div className="converter-form">
            {/* From Amount Input */}
            <div className="input-group">
              <label>You Send (Sell)</label>
              <div className="input-control-wrapper">
                <input 
                  type="number" 
                  value={convertFromAmount} 
                  onChange={(e) => setConvertFromAmount(e.target.value)} 
                  placeholder="0.00" 
                />
                <select 
                  value={convertFromCurrency} 
                  onChange={(e) => setConvertFromCurrency(e.target.value)}
                >
                  {availableCurrencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Middle swap button */}
            <div className="swap-btn-container">
              <button 
                type="button" 
                className="swap-circle-btn" 
                onClick={handleSwapCurrencies}
                title="Swap Base/Quote Currencies"
              >
                <ArrowLeftRight size={16} style={{ transform: 'rotate(90deg)' }} />
              </button>
            </div>

            {/* To Target Input */}
            <div className="input-group">
              <label>You Receive (Buy - Estimated)</label>
              <div className="input-control-wrapper">
                <input 
                  type="text" 
                  value={conversionResult} 
                  readOnly 
                  style={{ backgroundColor: 'transparent', cursor: 'not-allowed' }}
                />
                <select 
                  value={convertToCurrency} 
                  onChange={(e) => setConvertToCurrency(e.target.value)}
                >
                  {availableCurrencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conversion Result Text */}
            <div className="conversion-result-preview">
              1 {convertFromCurrency} = {(parseFloat(conversionResult) / (parseFloat(convertFromAmount) || 1)).toFixed(5)} {convertToCurrency}
            </div>

            <button 
              className="placeholder-btn" 
              style={{ width: '100%', padding: '12px' }}
              onClick={() => alert(`Exchange Request Placed: Exchange ${convertFromAmount} ${convertFromCurrency} for ${convertToCurrency}`)}
            >
              Execute Conversion
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Favorites Watchlist / Recent Transactions & Top Gainers/Losers */}
      <div className="dashboard-grid-secondary">
        {/* Watchlist & Ledger card */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <Star size={18} color="var(--primary)" />
              Favorite watchlist & Ledger
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Watchlist items */}
            <div className="watchlist-list">
              {favorites.map(curr => {
                const rate = currencyRates.rates[curr] || 1;
                const change = currencyRates.changes[curr] || 0.0;
                return (
                  <div key={curr} className="watchlist-row">
                    <div className="currency-info-flag">
                      <div className="currency-flag-circle">{curr}</div>
                      <div>
                        <span className="currency-name-lbl">{baseCurrency}/{curr}</span>
                        <div className="currency-full-lbl">Cross Rates</div>
                      </div>
                    </div>
                    <div className="currency-values">
                      <span className="currency-val-num">{rate.toFixed(4)}</span>
                      <span className={`currency-change-num ${change >= 0 ? 'trend-up' : 'trend-down'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Conversions Mini Table Ledger */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> Recent Transactions
              </h3>
              <div className="ledger-table-container">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Operation</th>
                      <th>Amount</th>
                      <th>Rate</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentConversions.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.date}</td>
                        <td>{tx.from} <ArrowLeftRight size={10} style={{ display: 'inline', margin: '0 4px' }} /> {tx.to}</td>
                        <td>{tx.amountFrom.toLocaleString()} {tx.from}</td>
                        <td>{tx.rate.toFixed(4)}</td>
                        <td>
                          <span className={`status-badge ${tx.status.toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Top Gainers & Losers Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <TrendingUp size={18} color="var(--primary)" />
              Market Spreads: Gainers & Losers
            </div>
          </div>

          <div className="gainer-loser-split">
            {/* Top Gainers */}
            <div className="gainer-loser-col">
              <h3 className="gainer-loser-title" style={{ color: 'var(--accent)' }}>Top Gainers (24h)</h3>
              {gainersLosers.gainers.map(item => (
                <div key={item.pair} className="gainer-loser-card gainer">
                  <div>
                    <div className="currency-name-lbl">{item.pair}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interbank</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="currency-val-num">{item.rate.toFixed(4)}</div>
                    <span className="trend-up" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                      <ArrowUpRight size={12} /> +{item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Losers */}
            <div className="gainer-loser-col">
              <h3 className="gainer-loser-title" style={{ color: 'var(--danger)' }}>Top Losers (24h)</h3>
              {gainersLosers.losers.map(item => (
                <div key={item.pair} className="gainer-loser-card loser">
                  <div>
                    <div className="currency-name-lbl">{item.pair}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interbank</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="currency-val-num">{item.rate.toFixed(4)}</div>
                    <span className="trend-down" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                      <ArrowDownRight size={12} /> {item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
