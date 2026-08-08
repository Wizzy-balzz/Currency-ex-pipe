import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  GitCompare, ArrowLeftRight, Check, Sparkles, 
  HelpCircle, AlertTriangle, RefreshCw, BarChart2,
  TrendingUp, TrendingDown, Info
} from 'lucide-react';
import { getRates } from '../utils/mockFxApi';
import { Line } from 'react-chartjs-2';
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

// Register Chart.js elements
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

const CURRENCY_DATABASE = [
  { code: 'USD', name: 'US Dollar', symbol: '$', bg: '#2563eb', usdRate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', bg: '#eab308', usdRate: 0.915 },
  { code: 'GBP', name: 'British Pound', symbol: '£', bg: '#4f46e5', usdRate: 0.782 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', bg: '#ef4444', usdRate: 154.45 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', bg: '#0891b2', usdRate: 83.49 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', bg: '#10b981', usdRate: 3.673 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', bg: '#f97316', usdRate: 1.372 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', bg: '#06b6d4', usdRate: 1.518 }
];

const Comparison = () => {
  const { theme } = useTheme();

  // Primary configuration states
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [selectedQuotes, setSelectedQuotes] = useState(['EUR', 'GBP', 'JPY']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulateError, setSimulateError] = useState(false);

  // Computed data matrices
  const [currentQuotes, setCurrentQuotes] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Sync calculations on changes
  useEffect(() => {
    calculateComparisonMatrix(baseCurrency, selectedQuotes, simulateError);
  }, [baseCurrency, selectedQuotes, simulateError]);

  // Execute computations
  const calculateComparisonMatrix = async (base, quotes, errorSimulated) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API handshake latency
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (errorSimulated) {
        throw new Error("Rates comparator engine timed out. Correlation database is offline.");
      }

      // Fetch base rates from the mock FX API
      const ratesData = getRates(base);

      // Build structured quotes detail relative to base
      const details = [];
      quotes.forEach(quote => {
        // Resolve cross rates relative to base
        const baseRef = CURRENCY_DATABASE.find(c => c.code === base);
        const quoteRef = CURRENCY_DATABASE.find(c => c.code === quote);
        
        let rateVal = ratesData.rates[quote];
        let changeVal = ratesData.changes[quote] || 0.0;

        if (rateVal === undefined && baseRef && quoteRef) {
          // Cross rate math relative to USD fallback values
          rateVal = quoteRef.usdRate / baseRef.usdRate;
          changeVal = (Math.random() - 0.5) * 1.8;
        }

        rateVal = parseFloat(rateVal.toFixed(5));
        const inverseVal = parseFloat((1 / rateVal).toFixed(5));

        details.push({
          ...quoteRef,
          rate: rateVal,
          inverseRate: inverseVal,
          change: parseFloat(changeVal.toFixed(2))
        });
      });

      setCurrentQuotes(details);

      // Generate 10-day normalized historical trends (%) starting at 0%
      let fetchSuccess = false;
      let finalLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'];
      let finalDatasets = [];

      try {
        const today = new Date();
        const prev = new Date();
        prev.setDate(today.getDate() - 15); // get slightly more to guarantee 10 business days

        const todayStr = today.toISOString().split('T')[0];
        const prevStr = prev.toISOString().split('T')[0];

        // Query multi quote list
        const quoteString = quotes.join(',');
        const url = `https://api.frankfurter.app/${prevStr}..${todayStr}?from=${base}&to=${quoteString}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.rates) {
          const sortedDates = Object.keys(data.rates).sort().slice(-10);
          
          if (sortedDates.length >= 2) {
            // Build custom normalized performance series for each quote
            finalDatasets = quotes.map(quote => {
              const quoteRef = CURRENCY_DATABASE.find(c => c.code === quote);
              const performancePoints = [];
              
              const firstDate = sortedDates[0];
              const firstRate = data.rates[firstDate][quote] || 1.0;

              sortedDates.forEach(d => {
                const rateOnDay = data.rates[d][quote] || firstRate;
                const changePct = ((rateOnDay - firstRate) / firstRate) * 100;
                performancePoints.push(parseFloat(changePct.toFixed(2)));
              });

              return {
                label: `${quoteRef ? quoteRef.name : quote} (%)`,
                data: performancePoints,
                borderColor: quoteRef ? quoteRef.bg : '#6b7280',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.2
              };
            });

            // Map dates as labels
            finalLabels = sortedDates.map(d => {
              const dateObj = new Date(d);
              return dateObj.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
            });

            fetchSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch comparative historical performance, falling back to random walk.", err);
      }

      if (!fetchSuccess) {
        finalLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'];
        finalDatasets = quotes.map(quote => {
          const quoteRef = CURRENCY_DATABASE.find(c => c.code === quote);
          const changeRate = ratesData.changes[quote] || 0.0;
          
          const performancePoints = [0.0];
          let currentPerf = 0.0;
          let seedVal = base.charCodeAt(0) + quote.charCodeAt(0);

          const nextRandom = () => {
            const x = Math.sin(seedVal++) * 10000;
            return x - Math.floor(x);
          };

          for (let i = 1; i < 10; i++) {
            const stepDrift = (nextRandom() - 0.5) * 0.8;
            const trendFactor = i === 9 ? (changeRate * 0.4) : 0;
            currentPerf = currentPerf + stepDrift + trendFactor;
            performancePoints.push(parseFloat(currentPerf.toFixed(2)));
          }

          return {
            label: `${base}/${quote} Performance (%)`,
            data: performancePoints,
            borderColor: quoteRef ? quoteRef.bg : '#6b7280',
            backgroundColor: 'transparent',
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          };
        });
      }

      setChartData({
        labels: finalLabels,
        datasets: finalDatasets
      });

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Checkbox toggle actions
  const handleToggleQuote = (quoteCode) => {
    if (selectedQuotes.includes(quoteCode)) {
      // Keep at least one quote compared
      if (selectedQuotes.length === 1) return;
      setSelectedQuotes(selectedQuotes.filter(q => q !== quoteCode));
    } else {
      // Limit to max 4 selections
      if (selectedQuotes.length >= 4) {
        alert("To maintain responsive viewports, comparison is capped at 4 quote currencies.");
        return;
      }
      setSelectedQuotes([...selectedQuotes, quoteCode]);
    }
  };

  // Base Currency selector handler
  const handleBaseChange = (newBase) => {
    setBaseCurrency(newBase);
    // Remove new base from quote selection if checked
    setSelectedQuotes(selectedQuotes.filter(q => q !== newBase));
  };

  // Force rates sync
  const handleForceRefresh = () => {
    calculateComparisonMatrix(baseCurrency, selectedQuotes, simulateError);
  };

  // Toggle simulate failure
  const handleToggleError = () => {
    const nextVal = !simulateError;
    setSimulateError(nextVal);
  };

  // Close error state and retry
  const handleRetry = () => {
    setSimulateError(false);
    calculateComparisonMatrix(baseCurrency, selectedQuotes, false);
  };

  // Chart axes details configured for Dark/Light modes
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', weight: '600' }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        bodyColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        borderWidth: 1,
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans' },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label.split(' ')[0]}: ${context.raw}%`;
          }
        }
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
          font: { family: 'Plus Jakarta Sans' },
          callback: function(value) {
            return value + '%';
          }
        },
      },
    },
  };

  // Compile active checklist (Base + selected quotes) for the matrix table
  const matrixHeaders = [baseCurrency, ...selectedQuotes];

  return (
    <div>
      {/* CSS spin animation keyframes */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1.2s linear infinite; }
      `}</style>

      {/* Page Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Currency Comparison</h1>
          <p className="page-subtitle">Evaluate performance trends, volatilities, and cross-rates across multiple assets side-by-side.</p>
        </div>

        <div className="dashboard-header-controls">
          <button 
            className="placeholder-btn" 
            onClick={handleToggleError} 
            style={{ 
              backgroundColor: simulateError ? 'var(--accent)' : 'var(--danger)', 
              fontSize: '0.75rem', 
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {simulateError ? "Disable Error Simulator" : "Simulate Gateway Fail"}
          </button>

          {/* Base selector */}
          <div className="base-select-wrapper">
            <label htmlFor="baseCompareSelect">Base Reference:</label>
            <select 
              id="baseCompareSelect" 
              className="currency-select-drop"
              value={baseCurrency}
              onChange={(e) => handleBaseChange(e.target.value)}
            >
              {CURRENCY_DATABASE.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>

          <button 
            className="icon-btn" 
            onClick={handleForceRefresh}
            title="Refresh comparators"
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <RefreshCw size={14} className={loading && !currentQuotes.length ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 1. API ERROR BOUNDARY */}
      {error ? (
        <div className="error-fallback-container" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <AlertTriangle size={48} color="var(--danger)" />
          <h2 className="error-fallback-title">Comparator Connection Timeout</h2>
          <p className="error-fallback-text">{error.message || "We encountered an issue synchronizing comparative rate matrices from the FX ledger."}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="error-retry-btn" onClick={handleRetry}>
              Retry Handshake
            </button>
            <button 
              className="error-retry-btn" 
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
              onClick={handleForceRefresh}
            >
              Force Sync
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tag Selector Grid */}
          <div className="compare-selection-panel">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitCompare size={16} /> Choose Quote Currencies to Compare (Select up to 4)
            </h3>
            <div className="compare-checkbox-grid">
              {CURRENCY_DATABASE
                .filter(curr => curr.code !== baseCurrency)
                .map(curr => {
                  const isActive = selectedQuotes.includes(curr.code);
                  return (
                    <label 
                      key={curr.code} 
                      className={`compare-tag-label ${isActive ? 'active' : ''}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={() => handleToggleQuote(curr.code)} 
                      />
                      <span className="currency-flag-circle" style={{ backgroundColor: curr.bg, color: '#ffffff', width: '24px', height: '24px', fontSize: '0.65rem' }}>
                        {curr.code.substring(0, 2)}
                      </span>
                      <span>{curr.code}</span>
                      {isActive && <Check size={14} style={{ marginLeft: 'auto' }} />}
                    </label>
                  );
                })}
            </div>
          </div>

          {/* 2. LOADING SKELETON */}
          {loading && !currentQuotes.length ? (
            <div>
              <div className="compare-cards-container">
                {[1, 2, 3].map(i => (
                  <div key={i} className="widget-card" style={{ height: '140px' }}>
                    <div className="skeleton-pulse skeleton-title" style={{ width: '40%' }}></div>
                    <div className="skeleton-pulse skeleton-text" style={{ width: '80%' }}></div>
                  </div>
                ))}
              </div>
              <div className="widget-card" style={{ height: '360px' }}>
                <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
              </div>
            </div>
          ) : (
            <>
              {/* Comparative Cards Container */}
              <div className="compare-cards-container">
                {currentQuotes.map(curr => (
                  <div 
                    key={curr.code} 
                    className={`compare-widget-card ${curr.code.toLowerCase()}`}
                  >
                    <div className="compare-card-title">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="currency-flag-circle" style={{ backgroundColor: curr.bg, color: '#ffffff', width: '28px', height: '28px', fontSize: '0.7rem' }}>
                          {curr.code.substring(0, 2)}
                        </span>
                        <span>{baseCurrency}/{curr.code}</span>
                      </div>
                      <span className={`currency-change-num ${curr.change >= 0 ? 'trend-up' : 'trend-down'}`} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {curr.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {curr.change >= 0 ? '+' : ''}{curr.change}%
                      </span>
                    </div>

                    <div>
                      <div className="compare-card-rate">{curr.rate.toFixed(4)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Inverted: 1 {curr.code} = {curr.inverseRate} {baseCurrency}
                      </div>
                    </div>

                    <div className="compare-card-footer">
                      <span>Spread: 0.015%</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Instant Clearing</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: Performance Charts (Multi-line Chart.js Normalized) */}
              <div className="widget-card" style={{ marginBottom: '24px' }}>
                <div className="widget-header">
                  <div className="widget-title">
                    <TrendingUp size={18} color="var(--primary)" />
                    Normalized Exchange Performance Trend (30 Days)
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={14} /> Aligned by % change from starting quote (Day 1 = 0%)
                  </span>
                </div>

                <div style={{ position: 'relative', height: '360px', width: '100%' }}>
                  {loading && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw className="spin-anim" size={24} color="var(--primary)" />
                    </div>
                  )}

                  {chartData && (
                    <Line data={chartData} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Row 3: Correlation Matrix Table Grid */}
              <div className="matrix-table-container">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GitCompare size={18} color="var(--primary)" />
                  Cross Rate Exchange Matrix
                </h3>
                
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Base / Quote</th>
                      {matrixHeaders.map(code => (
                        <th key={code} style={{ textAlign: 'center', fontWeight: 700 }}>{code}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixHeaders.map(rowCode => {
                      const rowRef = CURRENCY_DATABASE.find(c => c.code === rowCode);
                      return (
                        <tr key={rowCode}>
                          <td style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="currency-flag-circle" style={{ backgroundColor: rowRef ? rowRef.bg : '#64748b', color: '#ffffff', width: '24px', height: '24px', fontSize: '0.65rem' }}>
                              {rowCode.substring(0, 2)}
                            </span>
                            {rowCode}
                          </td>
                          {matrixHeaders.map(colCode => {
                            if (rowCode === colCode) {
                              return (
                                <td key={colCode} className="matrix-cell-diagonal">
                                  1.0000
                                </td>
                              );
                            }

                            // Math calculations: Rate of Column relative to Row
                            // e.g. cross = colRateInUSD / rowRateInUSD
                            const rowRateInUSD = rowCode === 'USD' ? 1.0 : (rowRef ? rowRef.usdRate : 1.0);
                            const colRef = CURRENCY_DATABASE.find(c => c.code === colCode);
                            const colRateInUSD = colCode === 'USD' ? 1.0 : (colRef ? colRef.usdRate : 1.0);
                            
                            const crossRate = colRateInUSD / rowRateInUSD;

                            return (
                              <td key={colCode} style={{ textAlign: 'center', fontWeight: 600 }}>
                                {crossRate.toFixed(4)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom informational guidance tip */}
              <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
                <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>
                  The exchange matrix displays interbank G10 and exotic cross clearing quotients. Rates sync continuously with global liquidity pipelines.
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Comparison;
