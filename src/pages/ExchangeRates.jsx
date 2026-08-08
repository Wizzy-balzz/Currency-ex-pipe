import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Search, Sliders, ChevronDown, ChevronUp, 
  ArrowLeftRight, ArrowUpRight, ArrowDownRight, RefreshCw, 
  ChevronLeft, ChevronRight, AlertOctagon, HelpCircle 
} from 'lucide-react';
import { getRates } from '../utils/mockFxApi';

import { COUNTRIES_REGISTRY } from '../utils/countryDatabase';

const buildCurrencyList = () => {
  const seen = new Set();
  const list = [];
  
  COUNTRIES_REGISTRY.forEach(c => {
    if (!seen.has(c.currency)) {
      seen.add(c.currency);
      list.push({
        code: c.currency,
        name: `${c.name} ${c.currency}`,
        region: c.region,
        group: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].includes(c.currency) ? 'G10' : 'Exotic',
        symbol: c.symbol,
        bg: getCurrencyColor(c.currency)
      });
    }
  });

  return list;
};

const getCurrencyColor = (code) => {
  const colors = {
    USD: '#2563eb', EUR: '#eab308', GBP: '#4f46e5', JPY: '#ef4444',
    AUD: '#10b981', CAD: '#f97316', CHF: '#64748b', SGD: '#ec4899',
    HKD: '#14b8a6', CNY: '#a855f7', NZD: '#06b6d4', INR: '#f59e0b',
    ZAR: '#10b981', MXN: '#0d9488'
  };
  return colors[code] || '#6b7280';
};

const CURRENCY_LIST = buildCurrencyList();

// Fallback rates for ZAR, MXN, INR relative to USD
const FALLBACK_USD_RATES = { ZAR: 18.2450, MXN: 19.3870, INR: 83.4890 };
const FALLBACK_CHANGES = { ZAR: 1.15, MXN: -0.42, INR: -0.05 };

// Interactive SVG sparklines generator
const Sparkline = ({ change, seed }) => {
  const points = [];
  const width = 100;
  const height = 30;
  
  // Simple seed generator to keep sparklines stable between updates
  let randomVal = seed.charCodeAt(0) + seed.charCodeAt(1) + (seed.charCodeAt(2) || 0);
  const nextRandom = () => {
    const x = Math.sin(randomVal++) * 10000;
    return x - Math.floor(x);
  };

  let yVal = 15;
  points.push(`0,${yVal}`);
  
  for (let i = 1; i <= 5; i++) {
    const x = i * 20;
    const drift = (nextRandom() - 0.5) * 12;
    const finalFactor = i === 5 ? (change * -3.5) : 0; 
    yVal = Math.max(3, Math.min(27, 15 + drift + finalFactor));
    points.push(`${x},${yVal}`);
  }

  const pointsStr = points.join(' ');
  const strokeColor = change >= 0 ? 'var(--accent)' : 'var(--danger)';

  return (
    <svg width={width} height={height} className="rates-sparkline-container" aria-hidden="true">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={pointsStr}
      />
    </svg>
  );
};

const ExchangeRates = () => {
  const navigate = useNavigate();

  // Search & Filter States
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, G10, EXOTIC
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulateError, setSimulateError] = useState(false);
  const [currenciesList, setCurrenciesList] = useState(CURRENCY_LIST);

  // Load countries dynamically from RestCountries API to expand currenciesList
  useEffect(() => {
    const loadLiveCurrencies = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all');
        const data = await res.json();
        if (Array.isArray(data)) {
          const seen = new Set();
          const list = [];
          
          COUNTRIES_REGISTRY.forEach(c => {
            if (!seen.has(c.currency)) {
              seen.add(c.currency);
              list.push({
                code: c.currency,
                name: `${c.name} ${c.currency}`,
                region: c.region,
                group: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].includes(c.currency) ? 'G10' : 'Exotic',
                symbol: c.symbol,
                bg: getCurrencyColor(c.currency)
              });
            }
          });

          data.forEach(c => {
            if (!c.currencies) return;
            const code = Object.keys(c.currencies)[0];
            if (!seen.has(code)) {
              seen.add(code);
              list.push({
                code,
                name: `${c.name.common} ${code}`,
                region: c.region || 'Exotic',
                group: 'Exotic',
                symbol: c.currencies[code].symbol || code,
                bg: getCurrencyColor(code)
              });
            }
          });

          setCurrenciesList(list);
        }
      } catch (err) {
        console.warn("Failed to load live country data for Exchange Rates. Using local fallback.", err);
      }
    };
    loadLiveCurrencies();
  }, []);

  // Sorting States
  const [sortKey, setSortKey] = useState('code'); // code, name, buy, sell, change
  const [sortDirection, setSortDirection] = useState('asc'); // asc, desc

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Processed currency data list
  const [processedRates, setProcessedRates] = useState([]);

  // Mock fetch function
  const loadRatesData = async (base, errorSimulated) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (errorSimulated) {
        throw new Error("Rates sync failed. Interbank pricing database is currently locked.");
      }

      // Fetch base rates from mock FX service
      const ratesData = getRates(base);
      
      // Merge with custom fallbacks for ZAR, MXN, INR cross rates
      const combinedRates = [];
      const baseUSDValue = ratesData.rates['USD'] || 1.0; 

      currenciesList.forEach((currency) => {
        // Rates relative to Base
        let rateVal = ratesData.rates[currency.code];
        let pctChange = ratesData.changes[currency.code] || 0.0;

        if (rateVal === undefined) {
          // If quote is not defined in base API, resolve relative to USD
          const quoteUSDValue = FALLBACK_USD_RATES[currency.code] || 1.0;
          
          // Cross rate calculations: baseCurrency -> USD -> targetCurrency
          rateVal = quoteUSDValue / baseUSDValue;
          pctChange = FALLBACK_CHANGES[currency.code] || 0.0;
        }

        // Apply dynamic margin splits for buying and selling rates
        const buyRate = rateVal * 0.9985;
        const sellRate = rateVal * 1.0015;

        combinedRates.push({
          ...currency,
          rate: parseFloat(rateVal.toFixed(5)),
          buyRate: parseFloat(buyRate.toFixed(5)),
          sellRate: parseFloat(sellRate.toFixed(5)),
          change: pctChange
        });
      });

      setProcessedRates(combinedRates);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Synchronize on parameters changes
  useEffect(() => {
    loadRatesData(baseCurrency, simulateError);
  }, [baseCurrency, simulateError, currenciesList]);

  // Click handler to refresh rates manual
  const handleForceRefresh = () => {
    setIsRefreshing(true);
    loadRatesData(baseCurrency, simulateError);
  };

  // Toggle simulate failure
  const handleToggleError = () => {
    const nextVal = !simulateError;
    setSimulateError(nextVal);
  };

  // Close error state and retry
  const handleRetry = () => {
    setSimulateError(false);
    loadRatesData(baseCurrency, false);
  };

  // Handle Sort triggers
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Reset pagination on filters
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Navigate to quick conversion module
  const handleNavigateToConverter = (targetQuote) => {
    navigate(`/converter?amount=1000&from=${baseCurrency}&to=${targetQuote}`);
  };

  // Filter currency rates list
  const filteredRates = processedRates.filter(item => {
    // Search match
    const matchesSearch = 
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab match
    const matchesTab = 
      activeTab === 'ALL' ||
      (activeTab === 'G10' && item.group === 'G10') ||
      (activeTab === 'EXOTIC' && item.group === 'Exotic');

    return matchesSearch && matchesTab;
  });

  // Sort currency rates list
  const sortedRates = [...filteredRates].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    if (sortKey === 'buy') {
      aVal = a.buyRate;
      bVal = b.buyRate;
    }
    if (sortKey === 'sell') {
      aVal = a.sellRate;
      bVal = b.sellRate;
    }

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    } else {
      return sortDirection === 'asc' 
        ? aVal - bVal 
        : bVal - aVal;
    }
  });

  // Paginated currency rates list
  const totalPages = Math.ceil(sortedRates.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedRates = sortedRates.slice(indexOfFirstItem, indexOfLastItem);

  // Sorting Indicators
  const renderSortIcon = (key) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', marginLeft: '4px' }} /> : <ChevronDown size={14} style={{ display: 'inline', marginLeft: '4px' }} />;
  };

  return (
    <div>
      {/* Dynamic spinning keyframe style */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1.2s linear infinite; }
      `}</style>

      {/* Page Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Live Exchange Board</h1>
          <p className="page-subtitle">Real-time quote sheets for multi-currency settlement clearing accounts.</p>
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

          <div className="base-select-wrapper">
            <label htmlFor="baseCurrencySelectRates">Base Currency:</label>
            <select 
              id="baseCurrencySelectRates" 
              className="currency-select-drop"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <button 
            className="icon-btn" 
            onClick={handleForceRefresh}
            title="Sync live spreads"
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 1. API ERROR BOUNDARY STATE */}
      {error ? (
        <div className="error-fallback-container" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <AlertOctagon size={48} color="var(--danger)" />
          <h2 className="error-fallback-title">Gateway Sync Failed</h2>
          <p className="error-fallback-text">{error.message || "We encountered an authorization issue requesting cross rates from the central gateway."}</p>
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
          {/* Controls Bar: Search + Tab Filters */}
          <div className="rates-controls-panel">
            <div className="rates-tabs">
              <button 
                type="button" 
                className={`rates-tab ${activeTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                All Markets
              </button>
              <button 
                type="button" 
                className={`rates-tab ${activeTab === 'G10' ? 'active' : ''}`}
                onClick={() => setActiveTab('G10')}
              >
                G10 Groups
              </button>
              <button 
                type="button" 
                className={`rates-tab ${activeTab === 'EXOTIC' ? 'active' : ''}`}
                onClick={() => setActiveTab('EXOTIC')}
              >
                Exotic spreads
              </button>
            </div>

            <div className="search-box" style={{ width: '320px', backgroundColor: 'var(--bg-input)' }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search quote code or currency name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 2. LOADING SKELETON */}
          {loading ? (
            <div className="rates-table-wrapper">
              <div style={{ padding: '24px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton-pulse skeleton-text" style={{ height: '36px', marginBottom: '12px' }}></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="rates-table-wrapper">
                <table className="rates-table">
                  <thead>
                    <tr>
                      <th className="rates-th-sortable" onClick={() => handleSort('code')}>
                        Currency Code {renderSortIcon('code')}
                      </th>
                      <th className="rates-th-sortable" onClick={() => handleSort('name')}>
                        Currency Name {renderSortIcon('name')}
                      </th>
                      <th className="rates-th-sortable" onClick={() => handleSort('buy')}>
                        Buy Rate (Bid) {renderSortIcon('buy')}
                      </th>
                      <th className="rates-th-sortable" onClick={() => handleSort('sell')}>
                        Sell Rate (Ask) {renderSortIcon('sell')}
                      </th>
                      <th className="rates-th-sortable" onClick={() => handleSort('change')}>
                        Daily Change (24h) {renderSortIcon('change')}
                      </th>
                      <th style={{ textAlign: 'center' }}>Weekly Trend</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRates.length > 0 ? (
                      paginatedRates.map((curr) => (
                        <tr key={curr.code}>
                          <td style={{ fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="currency-flag-circle" style={{ backgroundColor: curr.bg, color: '#ffffff', width: '28px', height: '28px', fontSize: '0.7rem' }}>
                                {curr.code.substring(0, 2)}
                              </span>
                              {baseCurrency}/{curr.code}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{curr.name}</td>
                          <td style={{ fontWeight: 600 }}>{curr.buyRate.toFixed(4)}</td>
                          <td style={{ fontWeight: 600 }}>{curr.sellRate.toFixed(4)}</td>
                          <td>
                            <span className={`currency-change-num ${curr.change >= 0 ? 'trend-up' : 'trend-down'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              {curr.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {curr.change >= 0 ? '+' : ''}{curr.change}%
                            </span>
                          </td>
                          <td style={{ display: 'flex', justifyContent: 'center' }}>
                            <Sparkline change={curr.change} seed={curr.code} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="placeholder-btn"
                              style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleNavigateToConverter(curr.code)}
                            >
                              <ArrowLeftRight size={12} />
                              Convert
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                          No currencies match your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="rates-mobile-cards">
                {paginatedRates.length > 0 ? (
                  paginatedRates.map((curr) => (
                    <div key={curr.code} className="rates-mobile-card">
                      <div className="rates-mobile-card-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="currency-flag-circle" style={{ backgroundColor: curr.bg, color: '#ffffff', width: '32px', height: '32px' }}>
                            {curr.code.substring(0, 2)}
                          </span>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{baseCurrency}/{curr.code}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{curr.name}</div>
                          </div>
                        </div>
                        <span className={`currency-change-num ${curr.change >= 0 ? 'trend-up' : 'trend-down'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.85rem' }}>
                          {curr.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {curr.change >= 0 ? '+' : ''}{curr.change}%
                        </span>
                      </div>

                      <div className="rates-mobile-card-row" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '10px 0' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BUY (BID)</div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{curr.buyRate.toFixed(4)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SELL (ASK)</div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{curr.sellRate.toFixed(4)}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>TREND</span>
                          <Sparkline change={curr.change} seed={curr.code} />
                        </div>
                      </div>

                      <button 
                        className="placeholder-btn" 
                        style={{ width: '100%', padding: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => handleNavigateToConverter(curr.code)}
                      >
                        <ArrowLeftRight size={14} />
                        Trade this Pair Now
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="widget-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No currencies match your filter criteria.
                  </div>
                )}
              </div>

              {/* PAGINATION WRAPPER */}
              <div className="rates-pagination">
                <div>
                  Showing <strong>{sortedRates.length > 0 ? indexOfFirstItem + 1 : 0}</strong> to <strong>{Math.min(indexOfLastItem, sortedRates.length)}</strong> of <strong>{sortedRates.length}</strong> currencies
                </div>

                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => (
                    <button
                      key={idx + 1}
                      className={`pagination-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ExchangeRates;
