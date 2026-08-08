import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getRates } from '../utils/mockFxApi';
import { 
  BellRing, Plus, Trash2, Edit, X, Save, AlertCircle, Check, 
  HelpCircle, RefreshCw, Volume2, ShieldAlert, Sparkles, Mail, MessageSquare, Play 
} from 'lucide-react';

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

const DEFAULT_ALERTS = [
  { id: 'al1', base: 'USD', quote: 'EUR', condition: 'above', value: 0.9300, channels: ['Email', 'Push'], status: 'active', createdAt: '2026-08-01' },
  { id: 'al2', base: 'USD', quote: 'GBP', condition: 'below', value: 0.7700, channels: ['SMS'], status: 'active', createdAt: '2026-08-03' },
  { id: 'al3', base: 'USD', quote: 'JPY', condition: 'above', value: 155.00, channels: ['Push', 'Email'], status: 'active', createdAt: '2026-08-04' }
];

const Alerts = () => {
  const { theme } = useTheme();

  // Rate alerts states synchronized with localStorage
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('apex_rate_alerts');
    return saved ? JSON.parse(saved) : DEFAULT_ALERTS;
  });

  // Modal dialog states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditingAlert, setActiveEditingAlert] = useState(null);

  // Form parameters
  const [formBase, setFormBase] = useState('USD');
  const [formQuote, setFormQuote] = useState('EUR');
  const [formCondition, setFormCondition] = useState('above'); // above / below
  const [formValue, setFormValue] = useState('');
  const [formChannels, setFormChannels] = useState({ Email: true, SMS: false, Push: true });
  const [formError, setFormError] = useState(null);

  // Tick simulation rates states
  const [loading, setLoading] = useState(true);
  const [liveRates, setLiveRates] = useState({});
  const [driftOffset, setDriftOffset] = useState(1.0); // Drift factor

  // Toast notifications states
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
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
        console.warn("Failed to load live country data for Alerts. Using G10 fallback.", err);
      }
    };
    loadLiveCurrencies();
  }, []);

  // Persist configurations to localStorage
  useEffect(() => {
    localStorage.setItem('apex_rate_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Fetch rates on mount
  const syncRates = () => {
    setLoading(true);
    const ratesData = getRates('USD');
    setLiveRates(ratesData.rates);
    setLoading(false);
  };

  useEffect(() => {
    syncRates();
  }, []);

  // Trigger floating alert toast
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  // Live rates alerts matching equation
  const checkAlertTriggers = (currentRates) => {
    let triggeredCount = 0;
    
    const updatedAlerts = alerts.map(al => {
      if (al.status !== 'active') return al;

      // Calculate cross rates relative to base and quote configurations
      // e.g. base=EUR, quote=JPY, rate = USD/JPY rate / USD/EUR rate
      const baseUSDValue = currentRates[al.base] || 1.0;
      const quoteUSDValue = currentRates[al.quote] || 1.0;
      const crossRate = quoteUSDValue / baseUSDValue;

      let isTriggered = false;
      if (al.condition === 'above' && crossRate >= al.value) {
        isTriggered = true;
      } else if (al.condition === 'below' && crossRate <= al.value) {
        isTriggered = true;
      }

      if (isTriggered) {
        triggeredCount++;
        triggerToast(`Rate Alert Triggered: ${al.base}/${al.quote} went ${al.condition} ${al.value} (Current: ${crossRate.toFixed(4)})`);
        return {
          ...al,
          status: 'triggered',
          triggeredAt: new Date().toLocaleTimeString()
        };
      }

      return al;
    });

    if (triggeredCount > 0) {
      setAlerts(updatedAlerts);
    }
  };

  // Simulate market drift triggers
  const handleMarketDriftTick = () => {
    // Random drift rates by +/- 2.5%
    const updatedRates = {};
    Object.keys(liveRates).forEach(code => {
      const factor = 1 + (Math.random() - 0.5) * 0.05;
      updatedRates[code] = parseFloat((liveRates[code] * factor).toFixed(4));
    });

    setLiveRates(updatedRates);
    checkAlertTriggers(updatedRates);
    triggerToast("Market quotes updated. Checking alert thresholds...");
  };

  // Validate form entries
  const validateForm = () => {
    const val = parseFloat(formValue);
    if (formBase === formQuote) {
      setFormError("Base and Quote currencies cannot match.");
      return false;
    }
    if (isNaN(val) || val <= 0) {
      setFormError("Please enter a valid, positive trigger target rate.");
      return false;
    }
    
    const channelsArr = Object.keys(formChannels).filter(ch => formChannels[ch]);
    if (channelsArr.length === 0) {
      setFormError("Please select at least one notification channel.");
      return false;
    }

    setFormError(null);
    return true;
  };

  // Add Alert CRUD
  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const channelsArr = Object.keys(formChannels).filter(ch => formChannels[ch]);

    const newAlert = {
      id: `al-${Math.random().toString(36).substring(2, 9)}`,
      base: formBase,
      quote: formQuote,
      condition: formCondition,
      value: parseFloat(formValue),
      channels: channelsArr,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAlerts([...alerts, newAlert]);
    setShowAddModal(false);
    resetForm();
    triggerToast("New rate alert configured successfully.");
  };

  // Open Edit Dialog
  const handleOpenEdit = (al) => {
    setActiveEditingAlert(al);
    setFormBase(al.base);
    setFormQuote(al.quote);
    setFormCondition(al.condition);
    setFormValue(al.value.toString());
    
    // Set checkboxes
    const chMap = { Email: false, SMS: false, Push: false };
    al.channels.forEach(ch => {
      chMap[ch] = true;
    });
    setFormChannels(chMap);
    setShowEditModal(true);
  };

  // Save Edit Alert CRUD
  const handleSaveEditAlert = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const channelsArr = Object.keys(formChannels).filter(ch => formChannels[ch]);

    setAlerts(alerts.map(al => 
      al.id === activeEditingAlert.id
        ? { ...al, base: formBase, quote: formQuote, condition: formCondition, value: parseFloat(formValue), channels: channelsArr }
        : al
    ));

    setShowEditModal(false);
    setActiveEditingAlert(null);
    resetForm();
    triggerToast("Rate alert threshold updated.");
  };

  // Delete Alert CRUD
  const handleDeleteAlert = (id) => {
    if (window.confirm("Are you sure you want to delete this rate alert configuration?")) {
      setAlerts(alerts.filter(al => al.id !== id));
      if (showEditModal) {
        setShowEditModal(false);
        setActiveEditingAlert(null);
        resetForm();
      }
      triggerToast("Rate alert deleted.");
    }
  };

  // Toggle channel checkbox state
  const handleChannelCheckbox = (chName) => {
    setFormChannels({
      ...formChannels,
      [chName]: !formChannels[chName]
    });
  };

  // Reset inputs
  const resetForm = () => {
    setFormValue('');
    setFormChannels({ Email: true, SMS: false, Push: true });
    setFormError(null);
  };

  // Filter Active vs Triggered Lists
  const activeAlerts = alerts.filter(al => al.status === 'active');
  const triggeredAlerts = alerts.filter(al => al.status === 'triggered');

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
          <h1 className="page-title">Exchange Rate Alerts</h1>
          <p className="page-subtitle">Configure real-time automated threshold notifications when rates trigger target caps.</p>
        </div>

        <div className="dashboard-header-controls">
          <button 
            className="placeholder-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent)' }}
            onClick={handleMarketDriftTick}
            title="Drift market quotes randomly to verify alert checks"
          >
            <Play size={16} />
            Simulate Market Tick
          </button>
          
          <button 
            className="placeholder-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { resetForm(); setFormBase('USD'); setFormQuote('EUR'); setFormCondition('above'); setShowAddModal(true); }}
          >
            <Plus size={16} />
            Create Rate Alert
          </button>
        </div>
      </div>

      {/* Main 2-column Layout splits */}
      <div className="alerts-layout-grid">
        
        {/* Left Side: Active Alerts Configs */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <BellRing size={18} color="var(--primary)" />
              Active Alert Configurations
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {activeAlerts.length} Active Configurations
            </span>
          </div>

          {activeAlerts.length > 0 ? (
            <div className="alert-cards-list">
              {activeAlerts.map(al => {
                const baseRef = CURRENCY_DATABASE.find(c => c.code === al.base);
                const quoteRef = CURRENCY_DATABASE.find(c => c.code === al.quote);

                return (
                  <div key={al.id} className="alert-config-card">
                    <div className="favorite-card-header">
                      <div className="alert-card-pair">
                        <span className="currency-flag-circle" style={{ backgroundColor: baseRef ? baseRef.bg : '#64748b', color: '#ffffff', width: '24px', height: '24px', fontSize: '0.65rem' }}>
                          {al.base.substring(0, 2)}
                        </span>
                        <span>{al.base}/{al.quote}</span>
                      </div>
                      <span className="badge-status alert-active" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        Active
                      </span>
                    </div>

                    <div>
                      <div className="alert-card-condition">
                        Goes {al.condition}
                      </div>
                      <div className="alert-card-rate">
                        {al.value.toFixed(4)}
                      </div>
                    </div>

                    <div className="alert-card-channels">
                      {al.channels.map(ch => (
                        <span key={ch} className="alert-channel-tag">{ch}</span>
                      ))}
                    </div>

                    <div className="alert-card-actions">
                      <button 
                        className="icon-btn" 
                        title="Edit threshold"
                        onClick={() => handleOpenEdit(al)}
                        style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="icon-btn" 
                        title="Delete alert"
                        onClick={() => handleDeleteAlert(al.id)}
                        style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <HelpCircle size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No active rate alerts configured.</p>
              <button 
                className="placeholder-btn" 
                style={{ marginTop: '12px', fontSize: '0.8rem' }}
                onClick={() => { resetForm(); setShowAddModal(true); }}
              >
                Configure First Alert
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Triggered Alerts History Feed */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <ShieldAlert size={18} color="var(--warning)" />
              Triggered History Ledger
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {triggeredAlerts.length} Events triggered
            </span>
          </div>

          {triggeredAlerts.length > 0 ? (
            <div className="triggered-log-wrapper">
              {triggeredAlerts.map(al => (
                <div key={al.id} className="triggered-log-row">
                  <div className="triggered-log-details">
                    <span className="triggered-log-title">
                      {al.base}/{al.quote} went {al.condition} {al.value.toFixed(4)}
                    </span>
                    <span className="triggered-log-time">
                      Triggered: {al.triggeredAt || 'Just Now'} • {al.channels.join(', ')} Notification Sent
                    </span>
                  </div>
                  <button 
                    className="favorites-star-btn"
                    title="Remove triggered entry"
                    onClick={() => handleDeleteAlert(al.id)}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Check size={36} style={{ marginBottom: '12px', color: 'var(--accent)', opacity: 0.5 }} />
              <p>No triggered alerts in this session.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Use "Simulate Market Tick" to test threshold triggers.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 3. ADD ALERT POPUP DIALOG */}
      {showAddModal && (
        <div className="portfolio-modal-overlay">
          <div className="portfolio-modal">
            <div className="portfolio-modal-header">
              <h2 className="portfolio-modal-title">Configure Rate Alert</h2>
              <button className="portfolio-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAlert} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div style={{ padding: '10px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Currency selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Base Reference</label>
                  <select 
                    className="portfolio-input-field" 
                    value={formBase} 
                    onChange={(e) => setFormBase(e.target.value)}
                  >
                    {currencyDatabase.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label>Quote Reference</label>
                  <select 
                    className="portfolio-input-field" 
                    value={formQuote} 
                    onChange={(e) => setFormQuote(e.target.value)}
                  >
                    {currencyDatabase.filter(c => c.code !== formBase).map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>

              {/* Condition parameters */}
              <div className="input-group">
                <label>Trigger Condition</label>
                <select 
                  className="portfolio-input-field" 
                  value={formCondition} 
                  onChange={(e) => setFormCondition(e.target.value)}
                >
                  <option value="above">Goes Above (Rate increases)</option>
                  <option value="below">Goes Below (Rate decreases)</option>
                </select>
              </div>

              {/* Target threshold rate */}
              <div className="input-group">
                <label>Target Exchange Rate</label>
                <input 
                  type="number" 
                  step="any"
                  className="portfolio-input-field"
                  placeholder="e.g. 0.9350"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>

              {/* Notification Channels */}
              <div className="input-group">
                <label>Notification Channels</label>
                <div className="form-checkbox-row">
                  <label className="form-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formChannels.Email} 
                      onChange={() => handleChannelCheckbox('Email')} 
                    />
                    Email
                  </label>
                  <label className="form-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formChannels.SMS} 
                      onChange={() => handleChannelCheckbox('SMS')} 
                    />
                    SMS
                  </label>
                  <label className="form-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formChannels.Push} 
                      onChange={() => handleChannelCheckbox('Push')} 
                    />
                    Push
                  </label>
                </div>
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
                  Add Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT ALERT POPUP DIALOG */}
      {showEditModal && activeEditingAlert && (
        <div className="portfolio-modal-overlay">
          <div className="portfolio-modal">
            <div className="portfolio-modal-header">
              <h2 className="portfolio-modal-title">Modify Rate Alert</h2>
              <button className="portfolio-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAlert} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div style={{ padding: '10px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Target threshold rate */}
              <div className="input-group">
                <label>Target Exchange Rate</label>
                <input 
                  type="number" 
                  step="any"
                  className="portfolio-input-field"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>

              {/* Notification Channels */}
              <div className="input-group">
                <label>Notification Channels</label>
                <div className="form-checkbox-row">
                  <label className="form-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formChannels.Email} 
                      onChange={() => handleChannelCheckbox('Email')} 
                    />
                    Email
                  </label>
                  <label className="form-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formChannels.SMS} 
                      onChange={() => handleChannelCheckbox('SMS')} 
                    />
                    SMS
                  </label>
                  <label className="form-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formChannels.Push} 
                      onChange={() => handleChannelCheckbox('Push')} 
                    />
                    Push
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="danger-btn" 
                  style={{ flex: 1 }}
                  onClick={() => handleDeleteAlert(activeEditingAlert.id)}
                >
                  Delete Alert
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

      {/* Floating Animated Toast Banner */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`} style={{ backgroundColor: '#f59e0b', color: '#0f172a' }}>
        <BellRing size={16} />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default Alerts;
