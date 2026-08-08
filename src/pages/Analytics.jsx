import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  BarChart2, TrendingUp, RefreshCw, AlertTriangle, ShieldCheck, 
  HelpCircle, Info, Database, Layers, ArrowUpRight, Network 
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register all chart plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const ENDPOINT_PERFORMANCE = [
  { path: '/v2/quotes/live', method: 'GET', hits: '412,980', latency: '9ms', errorRate: '0.01%', status: 'success' },
  { path: '/v2/exchange/convert', method: 'POST', hits: '272,400', latency: '24ms', errorRate: '0.04%', status: 'success' },
  { path: '/v2/historical/trend', method: 'GET', hits: '94,120', latency: '42ms', errorRate: '0.12%', status: 'success' },
  { path: '/v2/alerts/register', method: 'POST', hits: '38,510', latency: '14ms', errorRate: '0.00%', status: 'success' },
  { path: '/v2/portfolio/sync', method: 'GET', hits: '24,900', latency: '18ms', errorRate: '0.08%', status: 'success' }
];

const Analytics = () => {
  const { theme } = useTheme();

  // Page controller states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulateError, setSimulateError] = useState(false);

  // Analytics datasets
  const [areaData, setAreaData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [doughnutData, setDoughnutData] = useState(null);
  const [stats, setStats] = useState(null);

  // Sync calculations on changes
  useEffect(() => {
    calculateAnalytics(simulateError);
  }, [simulateError, theme]);

  // Execute computations
  const calculateAnalytics = async (errorSimulated) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API lag
      await new Promise(resolve => setTimeout(resolve, 900));

      if (errorSimulated) {
        throw new Error("Unable to synchronize business analytics. Telemetry database connection lost.");
      }

      // 1. Configure Area Chart Data (Monthly Volume transacted)
      setAreaData({
        labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
          {
            label: 'Monthly Trade Volume ($)',
            data: [2400000, 3100000, 2850000, 4200000, 3900000, 5248900],
            borderColor: '#2563eb',
            backgroundColor: theme === 'dark' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.04)',
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      });

      // 2. Configure Bar Chart Data (Daily API requests)
      setBarData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'API Request Hits',
            data: [120000, 145000, 130000, 155000, 160000, 85000, 95000],
            backgroundColor: '#10b981',
            borderRadius: 4,
            hoverBackgroundColor: '#059669'
          }
        ]
      });

      // 3. Configure Doughnut Chart Data (Pair splits transacted)
      setDoughnutData({
        labels: ['USD/EUR', 'USD/GBP', 'USD/JPY', 'EUR/GBP', 'Others'],
        datasets: [
          {
            data: [45, 25, 15, 10, 5],
            backgroundColor: ['#2563eb', '#4f46e5', '#ef4444', '#eab308', '#64748b'],
            borderWidth: theme === 'dark' ? 2 : 1,
            borderColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            hoverOffset: 4,
          }
        ]
      });

      // 4. Configure operational statistics
      setStats({
        volume: 12489000,
        hits: 842910,
        uptime: 99.98,
        latency: 14
      });

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Force sync
  const handleForceRefresh = () => {
    calculateAnalytics(simulateError);
  };

  // Toggle simulate failure
  const handleToggleError = () => {
    const nextVal = !simulateError;
    setSimulateError(nextVal);
  };

  // Close error state and retry
  const handleRetry = () => {
    setSimulateError(false);
    calculateAnalytics(false);
  };

  // Chart axes details configured for Dark/Light modes
  const chartOptionsCommon = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
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

  // Doughnut options configuration
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', weight: '600', size: 11 },
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        bodyColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        borderWidth: 1,
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans' },
        callbacks: {
          label: function(context) {
            return ` ${context.label}: ${context.raw}% volume`;
          }
        }
      }
    },
    cutout: '60%'
  };

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
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Inspect transaction trends, operational load performance, and telemetry statistics.</p>
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

          <button 
            className="icon-btn" 
            onClick={handleForceRefresh}
            title="Reload telemetry statistics"
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <RefreshCw size={14} className={loading && !stats ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 1. API ERROR BOUNDARY STATE */}
      {error ? (
        <div className="error-fallback-container" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <AlertTriangle size={48} color="var(--danger)" />
          <h2 className="error-fallback-title">Telemetry Sync Failure</h2>
          <p className="error-fallback-text">{error.message || "We encountered an exception connecting to the metrics data warehouse."}</p>
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
          {/* 2. LOADING SKELETON */}
          {loading && !stats ? (
            <div>
              <div className="analytics-stats-grid">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="widget-card" style={{ height: '100px' }}>
                    <div className="skeleton-pulse skeleton-title" style={{ width: '40%' }}></div>
                    <div className="skeleton-pulse skeleton-text" style={{ width: '70%' }}></div>
                  </div>
                ))}
              </div>
              <div className="analytics-layout-grid">
                <div className="widget-card" style={{ height: '320px' }}>
                  <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
                </div>
                <div className="widget-card" style={{ height: '320px' }}>
                  <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Analytics Stats Grid */}
              <div className="analytics-stats-grid">
                
                {/* Total Transacted Volume */}
                <div className="portfolio-stat-box">
                  <span className="history-stat-lbl">Aggregate Transacted Volume</span>
                  <span className="portfolio-stat-val" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>
                    ${stats.volume.toLocaleString()}
                  </span>
                  <span className="history-stat-footer">USD Equivalent</span>
                </div>

                {/* API Request Hits */}
                <div className="portfolio-stat-box">
                  <span className="history-stat-lbl">API Request Hits</span>
                  <span className="portfolio-stat-val" style={{ fontSize: '1.4rem' }}>
                    {stats.hits.toLocaleString()} hits
                  </span>
                  <span className="history-stat-footer">Gateway load</span>
                </div>

                {/* Node Uptime */}
                <div className="portfolio-stat-box">
                  <span className="history-stat-lbl">Global Rails Uptime</span>
                  <span className="portfolio-stat-val" style={{ color: 'var(--accent)', fontSize: '1.4rem' }}>
                    {stats.uptime}%
                  </span>
                  <span className="history-stat-footer">Operational rails</span>
                </div>

                {/* Response speed latency */}
                <div className="portfolio-stat-box">
                  <span className="history-stat-lbl">Average Node Latency</span>
                  <span className="portfolio-stat-val" style={{ fontSize: '1.4rem' }}>
                    {stats.latency}ms
                  </span>
                  <span className="history-stat-footer">Handshake latency</span>
                </div>

              </div>

              {/* Middle Grid: Area Chart (Transaction volume) and Doughnut Chart (Pair volume splits) */}
              <div className="analytics-layout-grid">
                {/* Area Chart Card */}
                <div className="widget-card">
                  <div className="widget-header">
                    <div className="widget-title">
                      <TrendingUp size={18} color="var(--primary)" />
                      Transaction Volume Growth (6 Months)
                    </div>
                  </div>

                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    {areaData && (
                      <Line data={areaData} options={chartOptionsCommon} />
                    )}
                  </div>
                </div>

                {/* Doughnut Chart Card */}
                <div className="widget-card">
                  <div className="widget-header">
                    <div className="widget-title">
                      <Layers size={18} color="var(--primary)" />
                      Popular Transacted Pairs (%)
                    </div>
                  </div>

                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    {doughnutData && (
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Grid: Bar Chart (Daily hits) and API Endpoints list table */}
              <div className="analytics-layout-grid-bottom">
                {/* Bar Chart Card */}
                <div className="widget-card">
                  <div className="widget-header">
                    <div className="widget-title">
                      <Database size={18} color="var(--primary)" />
                      Daily API Request Hit Rates
                    </div>
                  </div>

                  <div style={{ position: 'relative', height: '240px', width: '100%' }}>
                    {barData && (
                      <Bar data={barData} options={chartOptionsCommon} />
                    )}
                  </div>
                </div>

                {/* API Endpoints Performance table card */}
                <div className="widget-card">
                  <div className="widget-header">
                    <div className="widget-title">
                      <Network size={18} color="var(--primary)" />
                      Live Rails Node Telemetry
                    </div>
                  </div>

                  <div className="endpoint-table-container">
                    <table className="endpoint-table">
                      <thead>
                        <tr>
                          <th>Path Node</th>
                          <th>Method</th>
                          <th>Request Load</th>
                          <th>Response Speed</th>
                          <th>Err Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ENDPOINT_PERFORMANCE.map(node => (
                          <tr key={node.path}>
                            <td style={{ fontWeight: 700 }}>{node.path}</td>
                            <td>
                              <span className={`endpoint-method ${node.method.toLowerCase()}`}>
                                {node.method}
                              </span>
                            </td>
                            <td>{node.hits}</td>
                            <td style={{ fontWeight: 600 }}>{node.latency}</td>
                            <td>{node.errorRate}</td>
                            <td>
                              <span className="endpoint-status success">
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'inline-block' }}></span>
                                {node.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom informational guidelines tip banner */}
              <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
                <ShieldCheck size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span>
                  Telemetry statistics are calculated dynamically based on gateway logs. Uptime metrics comply with clearing agreement SLA definitions.
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
