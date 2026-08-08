import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getRates } from '../utils/mockFxApi';
import { 
  Wallet, Plus, Trash2, Edit, X, Save, 
  TrendingUp, TrendingDown, RefreshCw, AlertCircle,
  PieChart as PieIcon, HelpCircle, ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Doughnut-specific ChartJS plugins
ChartJS.register(ArcElement, Tooltip, Legend);

const getCurrencyTheme = (code) => {
  const themes = {
    USD: { bg: '#2563eb', label: 'US Dollar' },
    EUR: { bg: '#eab308', label: 'Euro' },
    GBP: { bg: '#4f46e5', label: 'British Pound' },
    JPY: { bg: '#ef4444', label: 'Japanese Yen' },
    AUD: { bg: '#10b981', label: 'Australian Dollar' },
    CAD: { bg: '#f97316', label: 'Canadian Dollar' },
    CHF: { bg: '#64748b', label: 'Swiss Franc' },
    SGD: { bg: '#ec4899', label: 'Singapore Dollar' },
    HKD: { bg: '#0d9488', label: 'Hong Kong Dollar' },
    CNH: { bg: '#a855f7', label: 'Chinese Yuan' },
    NZD: { bg: '#06b6d4', label: 'New Zealand Dollar' }
  };
  return themes[code] || { bg: '#6b7280', label: code };
};

const DEFAULT_HOLDINGS = [
  { id: 'h1', currency: 'EUR', amount: 5000, buyPrice: 1.08, date: '2026-06-15' },
  { id: 'h2', currency: 'GBP', amount: 3000, buyPrice: 1.25, date: '2026-07-02' },
  { id: 'h3', currency: 'JPY', amount: 200000, buyPrice: 0.0064, date: '2026-07-20' }
];

const Portfolio = () => {
  const { theme } = useTheme();

  // Primary holdings state loaded from local storage
  const [holdings, setHoldings] = useState(() => {
    const saved = localStorage.getItem('apex_portfolio_holdings');
    return saved ? JSON.parse(saved) : DEFAULT_HOLDINGS;
  });

  const [availableCurrencies, setAvailableCurrencies] = useState([]);

  // Modal visual states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditingHolding, setActiveEditingHolding] = useState(null);

  // Form states
  const [formCurrency, setFormCurrency] = useState('EUR');
  const [formAmount, setFormAmount] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formError, setFormError] = useState(null);

  // Live rates states
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState({});
  const [totals, setTotals] = useState({ value: 0, cost: 0, profit: 0, roi: 0 });
  const [chartData, setChartData] = useState(null);

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem('apex_portfolio_holdings', JSON.stringify(holdings));
    recalculatePortfolio();
  }, [holdings]);

  // Recalculate cost, value, and P&L balances
  const recalculatePortfolio = async () => {
    setLoading(true);
    try {
      // Simulate live gateway rates sync
      await new Promise(resolve => setTimeout(resolve, 800));
      const ratesData = getRates('USD'); // USD is base portfolio currency
      setRates(ratesData.rates);
      setAvailableCurrencies(Object.keys(ratesData.rates));

      if (holdings.length === 0) {
        setTotals({ value: 0, cost: 0, profit: 0, roi: 0 });
        setChartData(null);
        setLoading(false);
        return;
      }

      let totalCost = 0;
      let totalValue = 0;

      const allocationMap = {};

      holdings.forEach(h => {
        const rateInUSD = ratesData.rates[h.currency] || 1.0;
        // e.g. JPY per USD = 154.45, so 1 JPY rate in USD = 1 / 154.45 = 0.00647 USD
        const currentPriceInUSD = 1 / rateInUSD;

        const cost = h.amount * h.buyPrice;
        const value = h.amount * currentPriceInUSD;

        totalCost += cost;
        totalValue += value;

        // Group value by currency for allocation percentages
        allocationMap[h.currency] = (allocationMap[h.currency] || 0) + value;
      });

      const netProfit = totalValue - totalCost;
      const roiPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0.0;

      setTotals({
        value: parseFloat(totalValue.toFixed(2)),
        cost: parseFloat(totalCost.toFixed(2)),
        profit: parseFloat(netProfit.toFixed(2)),
        roi: parseFloat(roiPct.toFixed(2))
      });

      // Configure ChartJS allocations Doughnut dataset
      const labels = Object.keys(allocationMap);
      const dataValues = Object.values(allocationMap).map(v => parseFloat(((v / (totalValue || 1)) * 100).toFixed(2)));
      const backgrounds = labels.map(lbl => getCurrencyTheme(lbl).bg);

      setChartData({
        labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgrounds,
            borderWidth: theme === 'dark' ? 2 : 1,
            borderColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            hoverOffset: 4,
          }
        ]
      });

    } catch (err) {
      // Rates error fallback
    } finally {
      setLoading(false);
    }
  };

  // Trigger calculations on mounts
  useEffect(() => {
    recalculatePortfolio();
  }, [theme]);

  // Form input validator
  const validateForm = () => {
    const amt = parseFloat(formAmount);
    const price = parseFloat(formBuyPrice);

    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid, positive asset amount.");
      return false;
    }
    if (isNaN(price) || price <= 0) {
      setFormError("Please enter a valid, positive average purchase price.");
      return false;
    }
    setFormError(null);
    return true;
  };

  // Add Holding CRUD
  const handleAddHolding = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newHolding = {
      id: `h-${Math.random().toString(36).substring(2, 9)}`,
      currency: formCurrency,
      amount: parseFloat(formAmount),
      buyPrice: parseFloat(formBuyPrice),
      date: new Date().toISOString().split('T')[0]
    };

    setHoldings([...holdings, newHolding]);
    setShowAddModal(false);
    resetForm();
  };

  // Open Edit Dialog
  const handleOpenEdit = (holding) => {
    setActiveEditingHolding(holding);
    setFormCurrency(holding.currency);
    setFormAmount(holding.amount.toString());
    setFormBuyPrice(holding.buyPrice.toString());
    setShowEditModal(true);
  };

  // Save Edit Holding CRUD
  const handleSaveEditHolding = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setHoldings(holdings.map(h => 
      h.id === activeEditingHolding.id 
        ? { ...h, amount: parseFloat(formAmount), buyPrice: parseFloat(formBuyPrice) }
        : h
    ));

    setShowEditModal(false);
    setActiveEditingHolding(null);
    resetForm();
  };

  // Delete Holding CRUD
  const handleDeleteHolding = (id) => {
    if (window.confirm("Are you sure you want to remove this currency holding?")) {
      setHoldings(holdings.filter(h => h.id !== id));
      if (showEditModal) {
        setShowEditModal(false);
        setActiveEditingHolding(null);
        resetForm();
      }
    }
  };

  // Clear inputs
  const resetForm = () => {
    setFormAmount('');
    setFormBuyPrice('');
    setFormError(null);
  };

  // Doughnut chart adjustments
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', weight: '600', size: 12 },
          padding: 15
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
            return ` ${context.label}: ${context.raw}% allocation`;
          }
        }
      }
    },
    cutout: '65%'
  };

  return (
    <div>
      {/* Dynamic spinner keyframes stylesheet */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1.2s linear infinite; }
      `}</style>

      {/* Header controls bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Digital Portfolio</h1>
          <p className="page-subtitle">Track multi-currency capital value and real-time ROI performances.</p>
        </div>

        <div className="dashboard-header-controls">
          <button 
            className="placeholder-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { resetForm(); setFormCurrency('EUR'); setShowAddModal(true); }}
          >
            <Plus size={16} />
            Add Asset Holding
          </button>
          
          <button 
            className="icon-btn" 
            onClick={recalculatePortfolio}
            title="Refresh assets value"
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <RefreshCw size={14} className={loading && !holdings.length ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* Portfolio Stats Row */}
      <div className="portfolio-stats-grid">
        {/* Current Total Value */}
        <div className="portfolio-stat-box">
          <span className="history-stat-lbl">Aggregate Portfolio Value</span>
          <span className="portfolio-stat-val" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
            ${totals.value.toLocaleString()} USD
          </span>
          <span className="history-stat-footer">Live valuation</span>
        </div>

        {/* Cost Basis */}
        <div className="portfolio-stat-box">
          <span className="history-stat-lbl">Aggregate Cost Basis</span>
          <span className="portfolio-stat-val" style={{ fontSize: '1.5rem' }}>
            ${totals.cost.toLocaleString()} USD
          </span>
          <span className="history-stat-footer">Capital invested</span>
        </div>

        {/* Profit Loss */}
        <div className="portfolio-stat-box">
          <span className="history-stat-lbl">Net Profit / Loss</span>
          <span className={`portfolio-stat-val ${totals.profit >= 0 ? 'trend-up' : 'trend-down'}`} style={{ fontSize: '1.5rem' }}>
            {totals.profit >= 0 ? '+$' : '-$'}{Math.abs(totals.profit).toLocaleString()}
          </span>
          <span className="history-stat-footer" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {totals.profit >= 0 ? <ArrowUpRight size={12} className="trend-up" /> : <ArrowDownRight size={12} className="trend-down" />}
            vs cost basis
          </span>
        </div>

        {/* ROI percentage */}
        <div className="portfolio-stat-box">
          <span className="history-stat-lbl">Return on Capital (ROI)</span>
          <span className={`portfolio-stat-val ${totals.roi >= 0 ? 'trend-up' : 'trend-down'}`} style={{ fontSize: '1.5rem' }}>
            {totals.roi >= 0 ? '+' : ''}{totals.roi}%
          </span>
          <span className="history-stat-footer">Total yield</span>
        </div>
      </div>

      {/* 2. LOADING SKELETON */}
      {loading && !holdings.length ? (
        <div className="portfolio-layout-grid">
          <div className="widget-card" style={{ height: '320px' }}>
            <div className="skeleton-pulse skeleton-title" style={{ width: '40%' }}></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-pulse skeleton-text" style={{ height: '40px', marginBottom: '10px' }}></div>
            ))}
          </div>
          <div className="widget-card" style={{ height: '320px' }}>
            <div className="skeleton-pulse skeleton-circle" style={{ width: '160px', height: '160px', margin: '0 auto' }}></div>
          </div>
        </div>
      ) : (
        <>
          {/* Main 2-column Grid */}
          <div className="portfolio-layout-grid">
            
            {/* Left Side: Ledger holdings CRUD list */}
            <div className="widget-card">
              <div className="widget-header">
                <div className="widget-title">
                  <Wallet size={18} color="var(--primary)" />
                  Registered Assets Wallet
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {holdings.length} Assets Registered
                </span>
              </div>

              {holdings.length > 0 ? (
                <div className="portfolio-list-wrapper">
                  {holdings.map(h => {
                    const currentRateInUSD = rates[h.currency] || 1.0;
                    const livePrice = 1 / currentRateInUSD;
                    const costBasis = h.amount * h.buyPrice;
                    const currentValue = h.amount * livePrice;
                    const pl = currentValue - costBasis;
                    const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0.0;

                    return (
                      <div key={h.id} className="portfolio-asset-row">
                        <div className="asset-row-left">
                          <div 
                            className="currency-flag-circle" 
                            style={{ 
                              backgroundColor: getCurrencyTheme(h.currency).bg, 
                              color: '#ffffff',
                              width: '36px',
                              height: '36px',
                              fontWeight: 700
                            }}
                          >
                            {h.currency.substring(0, 2)}
                          </div>
                          <div className="asset-details">
                            <span className="asset-amount-lbl">{h.amount.toLocaleString()} {h.currency}</span>
                            <span className="asset-price-lbl">
                              Buy Price: ${h.buyPrice.toFixed(4)} • Current: ${livePrice.toFixed(4)}
                            </span>
                          </div>
                        </div>

                        <div className="asset-row-right">
                          <div className="asset-values-panel">
                            <span className="asset-current-val">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className={`currency-change-num ${pl >= 0 ? 'trend-up' : 'trend-down'}`}>
                              {pl >= 0 ? '+' : ''}{plPct.toFixed(2)}% (${pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </span>
                          </div>

                          <div className="asset-row-actions">
                            <button 
                              className="icon-btn" 
                              title="Edit position"
                              onClick={() => handleOpenEdit(h)}
                              style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="icon-btn" 
                              title="Delete position"
                              onClick={() => handleDeleteHolding(h.id)}
                              style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', color: 'var(--danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <HelpCircle size={36} style={{ marginBottom: '12px' }} />
                  <p>Your portfolio is currently empty.</p>
                  <button 
                    className="placeholder-btn" 
                    style={{ marginTop: '12px', fontSize: '0.8rem' }}
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                  >
                    Add Your First Holding
                  </button>
                </div>
              )}
            </div>

            {/* Right Side: Currency allocation Doughnut chart card */}
            <div className="widget-card">
              <div className="widget-header">
                <div className="widget-title">
                  <PieIcon size={18} color="var(--primary)" />
                  Asset Allocation (%)
                </div>
              </div>

              <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                {chartData ? (
                  <Doughnut data={chartData} options={chartOptions} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    Add currency holdings to display allocation weights.
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)' }}>
                <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Diversification across G10 payment corridors mitigates currency inflation risks.</span>
              </div>
            </div>

          </div>
        </>
      )}

      {/* 3. ADD ASSET POPUP MODAL */}
      {showAddModal && (
        <div className="portfolio-modal-overlay">
          <div className="portfolio-modal">
            <div className="portfolio-modal-header">
              <h2 className="portfolio-modal-title">Register Asset Position</h2>
              <button className="portfolio-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddHolding} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div style={{ padding: '10px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Currency Selector */}
              <div className="input-group">
                <label>Currency Asset</label>
                <select 
                  className="portfolio-input-field" 
                  value={formCurrency} 
                  onChange={(e) => setFormCurrency(e.target.value)}
                >
                  {availableCurrencies.map(code => (
                    <option key={code} value={code}>{code} - {getCurrencyTheme(code).label}</option>
                  ))}
                </select>
              </div>

              {/* Amount Size */}
              <div className="input-group">
                <label>Amount Held</label>
                <input 
                  type="number" 
                  className="portfolio-input-field"
                  placeholder="e.g. 5000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>

              {/* Entry Buy Price */}
              <div className="input-group">
                <label>Average Buy Price (in USD equivalent)</label>
                <input 
                  type="number" 
                  step="any"
                  className="portfolio-input-field"
                  placeholder="e.g. 1.08"
                  value={formBuyPrice}
                  onChange={(e) => setFormBuyPrice(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="placeholder-btn" 
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="placeholder-btn"
                  style={{ flex: 1 }}
                >
                  Add Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT ASSET POPUP MODAL */}
      {showEditModal && activeEditingHolding && (
        <div className="portfolio-modal-overlay">
          <div className="portfolio-modal">
            <div className="portfolio-modal-header">
              <h2 className="portfolio-modal-title">Modify {activeEditingHolding.currency} Position</h2>
              <button className="portfolio-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditHolding} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div style={{ padding: '10px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Amount Size */}
              <div className="input-group">
                <label>Amount Held</label>
                <input 
                  type="number" 
                  className="portfolio-input-field"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>

              {/* Entry Buy Price */}
              <div className="input-group">
                <label>Average Buy Price (in USD equivalent)</label>
                <input 
                  type="number" 
                  step="any"
                  className="portfolio-input-field"
                  value={formBuyPrice}
                  onChange={(e) => setFormBuyPrice(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="danger-btn" 
                  style={{ flex: 1 }}
                  onClick={() => handleDeleteHolding(activeEditingHolding.id)}
                >
                  Delete Holding
                </button>
                <button 
                  type="submit" 
                  className="placeholder-btn"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
