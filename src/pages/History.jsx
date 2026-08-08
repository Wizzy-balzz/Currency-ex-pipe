import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  TrendingUp, Download, Calendar, Sliders, 
  ArrowLeftRight, Info, AlertTriangle, RefreshCw,
  LineChart as LineIcon, AreaChart as AreaIcon, BarChart3 as BarIcon,
  ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { getRates } from '../utils/mockFxApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register all required Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'CNH', 'NZD'];

const History = () => {
  const { theme } = useTheme();
  const chartRef = useRef(null);

  // Selector states
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [quoteCurrency, setQuoteCurrency] = useState('EUR');
  const [timeframe, setTimeframe] = useState('30D'); // 7D, 30D, 90D, 1Y
  const [chartType, setChartType] = useState('area'); // line, area, bar

  // Operational states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulateError, setSimulateError] = useState(false);

  // History calculation outputs
  const [historyStats, setHistoryStats] = useState(null);
  const [timeframeLabels, setTimeframeLabels] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Generate timeframe dates and rates
  const calculateHistoryData = async (base, quote, tf, errorSimulated) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 900));

      if (errorSimulated) {
        throw new Error("Unable to retrieve history files. Server database response timeout.");
      }

      let points = [];
      let labels = [];
      let fetchSuccess = false;

      try {
        let daysAgo = 10;
        if (tf === '30D') daysAgo = 45;
        else if (tf === '90D') daysAgo = 130;
        else if (tf === '1Y') daysAgo = 400;

        const today = new Date();
        const prev = new Date();
        prev.setDate(today.getDate() - daysAgo);

        const todayStr = today.toISOString().split('T')[0];
        const prevStr = prev.toISOString().split('T')[0];

        const url = `https://api.frankfurter.app/${prevStr}..${todayStr}?from=${base}&to=${quote}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.rates) {
          const sortedDates = Object.keys(data.rates).sort();
          
          let targetDates = sortedDates;
          if (tf === '7D') {
            targetDates = sortedDates.slice(-7);
          } else if (tf === '30D') {
            targetDates = sortedDates.slice(-30);
          } else if (tf === '90D') {
            targetDates = sortedDates.slice(-90).filter((_, idx) => idx % 5 === 0);
          } else if (tf === '1Y') {
            targetDates = sortedDates.slice(-365).filter((_, idx) => idx % 30 === 0);
          }

          targetDates.forEach(d => {
            const dateObj = new Date(d);
            let labelStr = '';
            if (tf === '7D') {
              labelStr = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
            } else if (tf === '1Y') {
              labelStr = dateObj.toLocaleDateString(undefined, { month: 'short' });
            } else {
              labelStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
            }
            labels.push(labelStr);
            points.push(data.rates[d][quote]);
          });

          if (points.length > 0) {
            fetchSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch historical trend, falling back to random walk.", err);
      }

      // FALLBACK TO SIMULATED RANDOM WALK IF OFFLINE / FAILED
      if (!fetchSuccess) {
        const ratesData = getRates(base);
        const activeRate = ratesData.rates[quote] || 1.0;
        
        let length = 30;
        labels = [];
        const currentDate = new Date();

        if (tf === '7D') {
          length = 7;
          labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        } else if (tf === '30D') {
          length = 30;
          for (let i = 29; i >= 0; i--) {
            const d = new Date(currentDate);
            d.setDate(currentDate.getDate() - i);
            labels.push(d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }));
          }
        } else if (tf === '90D') {
          length = 18;
          for (let i = 17; i >= 0; i--) {
            const d = new Date(currentDate);
            d.setDate(currentDate.getDate() - i * 5);
            labels.push(d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }));
          }
        } else if (tf === '1Y') {
          length = 12;
          labels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
        }

        points = [];
        let currentVal = activeRate;
        let seedVal = base.charCodeAt(0) + quote.charCodeAt(0);
        
        const nextRandom = () => {
          const x = Math.sin(seedVal++) * 10000;
          return x - Math.floor(x);
        };

        for (let i = 0; i < length; i++) {
          points.unshift(parseFloat(currentVal.toFixed(5)));
          const walkDrift = (nextRandom() - 0.5) * 0.02; 
          currentVal = currentVal * (1 + walkDrift);
        }
      }

      setTimeframeLabels(labels);

      const max = Math.max(...points);
      const min = Math.min(...points);
      const avg = points.reduce((sum, v) => sum + v, 0) / points.length;
      const volatility = ((max - min) / min) * 100;

      const stats = {
        points,
        max: parseFloat(max.toFixed(5)),
        min: parseFloat(min.toFixed(5)),
        avg: parseFloat(avg.toFixed(5)),
        volatility: parseFloat(volatility.toFixed(2))
      };

      setHistoryStats(stats);

      // Configure Chart.js datasets
      const primaryColor = '#2563eb';
      const fillGradient = chartType === 'area';
      
      setChartData({
        labels: labels,
        datasets: [
          {
            label: `${base}/${quote} Rate`,
            data: points,
            borderColor: primaryColor,
            backgroundColor: fillGradient ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
            tension: 0.35,
            fill: fillGradient,
            borderWidth: 2,
            pointRadius: length > 30 ? 1 : 3,
            pointHoverRadius: 6,
          }
        ]
      });

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-calculate when selectors change
  useEffect(() => {
    calculateHistoryData(baseCurrency, quoteCurrency, timeframe, simulateError);
  }, [baseCurrency, quoteCurrency, timeframe, chartType, simulateError]);

  // Adjust options if quote matches base
  const handleBaseChange = (newBase) => {
    setBaseCurrency(newBase);
    if (quoteCurrency === newBase) {
      setQuoteCurrency(newBase === 'USD' ? 'EUR' : 'USD');
    }
  };

  // Swap currencies
  const handleSwapPairs = () => {
    const temp = baseCurrency;
    setBaseCurrency(quoteCurrency);
    setQuoteCurrency(temp);
  };

  // Refresh rate databases
  const handleForceRefresh = () => {
    calculateHistoryData(baseCurrency, quoteCurrency, timeframe, simulateError);
  };

  // Toggle simulate failure
  const handleToggleError = () => {
    const nextVal = !simulateError;
    setSimulateError(nextVal);
  };

  // Close error state and retry successfully
  const handleRetry = () => {
    setSimulateError(false);
    calculateHistoryData(baseCurrency, quoteCurrency, timeframe, false);
  };

  // Export Chart Canvas as PNG Image file
  const handleExportPNG = () => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.canvas;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ApexExchange_Trend_${baseCurrency}_${quoteCurrency}_${timeframe}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export timeframe rates to spreadsheet CSV file
  const handleExportCSV = () => {
    if (!historyStats || !timeframeLabels) return;

    let csvContent = "data:text/csv;charset=utf-8,Date Label,Exchange Rate\n";
    timeframeLabels.forEach((label, idx) => {
      csvContent += `"${label}","${historyStats.points[idx]}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `ApexExchange_Rates_${baseCurrency}_${quoteCurrency}_${timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart axes variables tailored for theme changes
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
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans' }
      },
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
        },
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
        },
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        },
      },
    },
  };

  return (
    <div>
      {/* CSS spin animation keyframes */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1.2s linear infinite; }
      `}</style>

      {/* Header title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Historical Trends</h1>
          <p className="page-subtitle">Inspect historical FX movements, volatility ratios, and interbank quote timelines.</p>
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

          {/* Base Selector */}
          <div className="base-select-wrapper">
            <label htmlFor="baseSelectHistory">Base:</label>
            <select 
              id="baseSelectHistory" 
              className="currency-select-drop"
              value={baseCurrency}
              onChange={(e) => handleBaseChange(e.target.value)}
            >
              {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Swap Trigger */}
          <button 
            className="icon-btn" 
            onClick={handleSwapPairs}
            title="Swap currency configuration"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px' }}
          >
            <ArrowLeftRight size={14} />
          </button>

          {/* Quote Selector */}
          <div className="base-select-wrapper">
            <label htmlFor="quoteSelectHistory">Quote:</label>
            <select 
              id="quoteSelectHistory" 
              className="currency-select-drop"
              value={quoteCurrency}
              onChange={(e) => setQuoteCurrency(e.target.value)}
            >
              {CURRENCY_OPTIONS.filter(c => c !== baseCurrency).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button 
            className="icon-btn" 
            onClick={handleForceRefresh}
            title="Reload history data"
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <RefreshCw size={14} className={loading && !historyStats ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 1. ERROR FALLBACK CONTROL */}
      {error ? (
        <div className="error-fallback-container" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <AlertTriangle size={48} color="var(--danger)" />
          <h2 className="error-fallback-title">History Database Locked</h2>
          <p className="error-fallback-text">{error.message || "We encountered a timeout exception connecting to the historical quotation index."}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="error-retry-btn" onClick={handleRetry}>
              Retry API Handshake
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
          {/* 2. SKELETON LOADER SCREEN */}
          {loading && !historyStats ? (
            <div>
              <div className="history-header-bar">
                <div className="skeleton-pulse" style={{ width: '200px', height: '36px' }}></div>
                <div className="skeleton-pulse" style={{ width: '120px', height: '36px' }}></div>
              </div>
              <div className="widget-card" style={{ height: '360px' }}>
                <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
              </div>
            </div>
          ) : (
            <>
              {/* Controls bar: Timeframe Toggles and Format Toggles */}
              <div className="history-header-bar">
                <div className="timeframe-group">
                  {['7D', '30D', '90D', '1Y'].map(tf => (
                    <button
                      key={tf}
                      type="button"
                      className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf === '7D' ? '7 Days' : tf === '30D' ? '30 Days' : tf === '90D' ? '90 Days' : '1 Year'}
                    </button>
                  ))}
                </div>

                <div className="chart-types-group">
                  <button
                    type="button"
                    className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                    onClick={() => setChartType('line')}
                    title="Line Chart Format"
                  >
                    <LineIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
                    onClick={() => setChartType('area')}
                    title="Area Chart Format"
                  >
                    <AreaIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                    onClick={() => setChartType('bar')}
                    title="Bar Chart Format"
                  >
                    <BarIcon size={16} />
                  </button>
                </div>
              </div>

              {/* Main Chart Card */}
              <div className="widget-card">
                <div className="widget-header">
                  <div className="widget-title">
                    <TrendingUp size={18} color="var(--primary)" />
                    {baseCurrency}/{quoteCurrency} Rate Graph ({timeframe})
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Quote Margin: 0.015% (Tight mid-market spreads)
                  </span>
                </div>

                <div style={{ position: 'relative', height: '360px', width: '100%' }}>
                  {loading && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw className="spin-anim" size={24} color="var(--primary)" />
                    </div>
                  )}

                  {chartData && (
                    chartType === 'bar' ? (
                      <Bar ref={chartRef} data={chartData} options={chartOptions} />
                    ) : (
                      <Line ref={chartRef} data={chartData} options={chartOptions} />
                    )
                  )}
                </div>

                {/* Exporters links row */}
                <div className="export-actions-row">
                  <button className="action-strip-btn" style={{ flex: 'none', padding: '8px 16px' }} onClick={handleExportPNG}>
                    <Download size={14} />
                    Export Chart (PNG)
                  </button>
                  <button className="action-strip-btn" style={{ flex: 'none', padding: '8px 16px' }} onClick={handleExportCSV}>
                    <FileSpreadsheet size={14} />
                    Download CSV Data
                  </button>
                </div>
              </div>

              {/* 4 Summary Stats Grid */}
              {historyStats && (
                <div className="history-stats-grid">
                  <div className="history-stat-card">
                    <span className="history-stat-lbl">Timeframe High</span>
                    <span className="history-stat-val">
                      {historyStats.max} {quoteCurrency}
                    </span>
                    <span className="history-stat-footer">Peak trading rate</span>
                  </div>

                  <div className="history-stat-card">
                    <span className="history-stat-lbl">Timeframe Low</span>
                    <span className="history-stat-val">
                      {historyStats.min} {quoteCurrency}
                    </span>
                    <span className="history-stat-footer">Trough trading rate</span>
                  </div>

                  <div className="history-stat-card">
                    <span className="history-stat-lbl">Timeframe Mean</span>
                    <span className="history-stat-val">
                      {historyStats.avg} {quoteCurrency}
                    </span>
                    <span className="history-stat-footer">Average rate spread</span>
                  </div>

                  <div className="history-stat-card">
                    <span className="history-stat-lbl">Volatility Index</span>
                    <span className="history-stat-val" style={{ color: historyStats.volatility > 2.5 ? 'var(--danger)' : 'var(--accent)' }}>
                      {historyStats.volatility}%
                    </span>
                    <span className="history-stat-footer">Timeframe swing range</span>
                  </div>
                </div>
              )}

              {/* Informative warning tip */}
              <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
                <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>
                  Historical data details interbank settlement quotation feeds compiled since 2024. All spreads conform to compliance audit constraints for G10 payment clearances.
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default History;
