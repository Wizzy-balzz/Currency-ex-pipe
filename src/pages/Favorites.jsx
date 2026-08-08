import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Search, ArrowLeftRight, TrendingUp, HelpCircle, 
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, Info,
  Sparkles, PlusCircle, Trash2
} from 'lucide-react';
import { getRates } from '../utils/mockFxApi';

import { COUNTRIES_REGISTRY } from '../utils/countryDatabase';

const buildCurrencyList = () => {
  const seen = new Set();
  const list = [];
  const order = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'HKD', 'CNY', 'NZD', 'INR', 'AED', 'ZAR', 'MXN'];
  
  order.forEach(code => {
    const match = COUNTRIES_REGISTRY.find(c => c.currency === code);
    if (match) {
      seen.add(code);
      list.push({
        code: match.currency,
        name: `${match.name} ${match.currency}`,
        symbol: match.symbol,
        bg: getCurrencyColor(match.currency)
      });
    }
  });

  COUNTRIES_REGISTRY.forEach(c => {
    if (!seen.has(c.currency)) {
      seen.add(c.currency);
      list.push({
        code: c.currency,
        name: `${c.name} ${c.currency}`,
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

const CURRENCY_DATABASE = buildCurrencyList();

// Pseudorandom SVG sparkline helper
const Sparkline = ({ change, seed }) => {
  const points = [];
  const width = 100;
  const height = 30;
  
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
    <svg width={width} height={height} style={{ width: '100px', height: '30px' }} aria-hidden="true">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={pointsStr}
      />
    </svg>
  );
};

const Favorites = () => {
  const navigate = useNavigate();

  // Watchlist states
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulateError, setSimulateError] = useState(false);
  const [currencyDatabase, setCurrencyDatabase] = useState(CURRENCY_DATABASE);

  // Load countries dynamically from RestCountries API to expand currencyDatabase
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
                symbol: c.currencies[code].symbol || code,
                bg: getCurrencyColor(code)
              });
            }
          });

          setCurrencyDatabase(list);
        }
      } catch (err) {
        console.warn("Failed to load live country data for Favorites. Using local G10 fallback.", err);
      }
    };
    loadLiveCurrencies();
  }, []);

  // Starred list (synchronized with shared localStorage key)
  const [starredList, setStarredList] = useState(() => {
    const saved = localStorage.getItem('apex_favorites');
    return saved ? JSON.parse(saved) : ['EUR', 'GBP', 'JPY', 'CHF'];
  });

  const [watchlistRates, setWatchlistRates] = useState([]);

  // Save changes back to local storage
  useEffect(() => {
    localStorage.setItem('apex_favorites', JSON.stringify(starredList));
    calculateWatchlistRates(baseCurrency, starredList, simulateError);
  }, [starredList, baseCurrency, simulateError, currencyDatabase]);

  // Recalculate watchlist rates details
  const calculateWatchlistRates = async (base, stars, errorSimulated) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate live rates sync delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (errorSimulated) {
        throw new Error("Unable to sync watchlist rates. Connection timed out.");
      }

      const ratesData = getRates(base);
      const items = [];

      stars.forEach(code => {
        // Skip base currency comparison with itself
        if (code === base) return;

        const currencyRef = currencyDatabase.find(c => c.code === code);
        if (!currencyRef) return;

        const rate = ratesData.rates[code] || 1.0;
        const change = ratesData.changes[code] || 0.0;

        items.push({
          ...currencyRef,
          rate: parseFloat(rate.toFixed(5)),
          change: parseFloat(change.toFixed(2))
        });
      });

      setWatchlistRates(items);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle star state CRUD
  const handleToggleStar = (currencyCode) => {
    if (starredList.includes(currencyCode)) {
      setStarredList(starredList.filter(c => c !== currencyCode));
    } else {
      setStarredList([...starredList, currencyCode]);
    }
  };

  // Base Currency selector handler
  const handleBaseCurrencyChange = (newBase) => {
    setBaseCurrency(newBase);
  };

  // Force rates refetch
  const handleForceRefresh = () => {
    calculateWatchlistRates(baseCurrency, starredList, simulateError);
  };

  // Toggle simulate failure
  const handleToggleError = () => {
    const nextVal = !simulateError;
    setSimulateError(nextVal);
  };

  // Close error state and retry
  const handleRetry = () => {
    setSimulateError(false);
    calculateWatchlistRates(baseCurrency, starredList, false);
  };

  // Action links
  const handleNavigateConverter = (quote) => {
    navigate(`/converter?amount=1000&from=${baseCurrency}&to=${quote}`);
  };

  const handleNavigateHistory = (quote) => {
    navigate(`/history?base=${baseCurrency}&quote=${quote}`);
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
          <h1 className="page-title">Starred Watchlist</h1>
          <p className="page-subtitle">Personalized forex boards. Star currency quotes to track them on your cockpit feed.</p>
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

          {/* Base select */}
          <div className="base-select-wrapper">
            <label htmlFor="baseSelectFav">Base Currency:</label>
            <select 
              id="baseSelectFav" 
              className="currency-select-drop"
              value={baseCurrency}
              onChange={(e) => handleBaseCurrencyChange(e.target.value)}
            >
              {CURRENCY_DATABASE.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>

          <button 
            className="icon-btn" 
            onClick={handleForceRefresh}
            title="Reload watchlist rates"
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <RefreshCw size={14} className={loading && !watchlistRates.length ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 1. API ERROR BOUNDARY STATE */}
      {error ? (
        <div className="error-fallback-container" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <AlertTriangle size={48} color="var(--danger)" />
          <h2 className="error-fallback-title">Watchlist Sync Failure</h2>
          <p className="error-fallback-text">{error.message || "We encountered an exception requesting rates for your starred assets."}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="error-retry-btn" onClick={handleRetry}>
              Retry Connection
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
          {/* Star selector pills panel */}
          <div className="favorites-select-box">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={16} fill="var(--warning)" color="var(--warning)" /> Star Quote Currencies to build your FX watchlist
            </h3>
            
            <div className="favorites-selector-grid">
              {currencyDatabase
                .filter(curr => curr.code !== baseCurrency)
                .map(curr => {
                  const isStarred = starredList.includes(curr.code);
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      className={`favorites-selector-item ${isStarred ? 'starred' : ''}`}
                      onClick={() => handleToggleStar(curr.code)}
                    >
                      <Star 
                        size={14} 
                        fill={isStarred ? '#f59e0b' : 'transparent'} 
                        color={isStarred ? '#f59e0b' : 'var(--text-muted)'} 
                      />
                      <span>{curr.code}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 2. LOADING SKELETON */}
          {loading && !watchlistRates.length ? (
            <div className="favorites-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="widget-card" style={{ height: '180px' }}>
                  <div className="skeleton-pulse skeleton-title" style={{ width: '40%' }}></div>
                  <div className="skeleton-pulse skeleton-text" style={{ width: '80%' }}></div>
                  <div className="skeleton-pulse skeleton-text" style={{ width: '50%' }}></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Watchlist cards grid */}
              {watchlistRates.length > 0 ? (
                <div className="favorites-grid">
                  {watchlistRates.map(curr => (
                    <div key={curr.code} className="favorite-card">
                      
                      {/* Card Header: Pair & Star control */}
                      <div className="favorite-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="currency-flag-circle" style={{ backgroundColor: curr.bg, color: '#ffffff', width: '28px', height: '28px', fontSize: '0.7rem' }}>
                            {curr.code.substring(0, 2)}
                          </span>
                          <span style={{ fontWeight: 700 }}>{baseCurrency}/{curr.code}</span>
                        </div>
                        
                        <button 
                          className="favorites-star-btn active"
                          onClick={() => handleToggleStar(curr.code)}
                          title="Remove from favorites"
                        >
                          <Star size={18} fill="#f59e0b" color="#f59e0b" />
                        </button>
                      </div>

                      {/* Card Body: Rates & SVGs Sparklines */}
                      <div className="favorite-card-body">
                        <div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {curr.rate.toFixed(4)}
                          </div>
                          <span className={`currency-change-num ${curr.change >= 0 ? 'trend-up' : 'trend-down'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}>
                            {curr.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {curr.change >= 0 ? '+' : ''}{curr.change}%
                          </span>
                        </div>

                        <Sparkline change={curr.change} seed={curr.code} />
                      </div>

                      {/* Card Actions */}
                      <div className="favorite-card-actions">
                        <button 
                          className="placeholder-btn"
                          onClick={() => handleNavigateConverter(curr.code)}
                          title="Go to converter"
                        >
                          <ArrowLeftRight size={12} />
                          Convert
                        </button>
                        <button 
                          className="action-strip-btn"
                          onClick={() => handleNavigateHistory(curr.code)}
                          title="Go to history"
                        >
                          <TrendingUp size={12} />
                          History
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="widget-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  <Star size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <h3>Your watchlist is empty</h3>
                  <p style={{ fontSize: '0.85rem', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0' }}>
                    Select base rates and click currency pills above to build your custom watchlist.
                  </p>
                </div>
              )}

              {/* Bottom informational guidelines tip */}
              <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
                <Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>
                  Watchlist favorites synchronize with the cockpit dashboard in real-time. Settings persist inside your local browser.
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Favorites;
