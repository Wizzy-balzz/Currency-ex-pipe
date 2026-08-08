import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, Copy, Share2, Download, RefreshCw, 
  Search, ShieldAlert, Sparkles, Check, Info, FileText 
} from 'lucide-react';
import { getRates } from '../utils/mockFxApi';

import { COUNTRIES_REGISTRY } from '../utils/countryDatabase';

// De-duplicate list of currencies from the countries registry
const buildCurrencyList = () => {
  const seen = new Set();
  const list = [];
  
  // Sort USD and EUR to the front for premium default layouts
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

// Helper for colors
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

const Converter = () => {
  // Calculator values
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState(CURRENCY_LIST[0]); // USD
  const [toCurrency, setToCurrency] = useState(CURRENCY_LIST[1]); // EUR
  const [conversionResult, setConversionResult] = useState('915.00');

  // Search popovers
  const [showFromPopover, setShowFromPopover] = useState(false);
  const [showToPopover, setShowToPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Page statuses
  const [isConverting, setIsConverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Dynamic rates values
  const [currentRate, setCurrentRate] = useState(0.9150);
  const [inverseRate, setInverseRate] = useState(1.0929);

  // Toast systems
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [currenciesList, setCurrenciesList] = useState(CURRENCY_LIST);

  // Popover refs to handle closing on clicking outside
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Load currencies dynamically from RestCountries API to expand currenciesList
  useEffect(() => {
    const loadLiveCurrencies = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all');
        const data = await res.json();
        if (Array.isArray(data)) {
          const seen = new Set();
          const list = [];
          
          // Sort USD, EUR, etc. first
          const order = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'HKD', 'CNY', 'NZD', 'INR', 'AED', 'ZAR', 'MXN'];
          
          order.forEach(code => {
            const match = data.find(c => c.currencies && c.currencies[code]);
            if (match) {
              seen.add(code);
              list.push({
                code,
                name: `${match.name.common} ${code}`,
                symbol: match.currencies[code].symbol || code,
                bg: getCurrencyColor(code)
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

          setCurrenciesList(list);
          
          // Sync current selections with loaded currencies in case of parameter pre-fills
          const params = new URLSearchParams(window.location.search);
          const queryFrom = params.get('from');
          const queryTo = params.get('to');
          if (queryFrom) {
            const foundFrom = list.find(c => c.code === queryFrom.toUpperCase());
            if (foundFrom) setFromCurrency(foundFrom);
          }
          if (queryTo) {
            const foundTo = list.find(c => c.code === queryTo.toUpperCase());
            if (foundTo) setToCurrency(foundTo);
          }
        }
      } catch (err) {
        console.warn("Failed to load live country data for converter. Using G10 fallback.", err);
      }
    };
    loadLiveCurrencies();
  }, []);

  // Detect query params on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryAmount = params.get('amount');
    const queryFrom = params.get('from');
    const queryTo = params.get('to');

    if (queryAmount) setAmount(queryAmount);
    if (queryFrom) {
      const foundFrom = currenciesList.find(c => c.code === queryFrom.toUpperCase());
      if (foundFrom) setFromCurrency(foundFrom);
    }
    if (queryTo) {
      const foundTo = currenciesList.find(c => c.code === queryTo.toUpperCase());
      if (foundTo) setToCurrency(foundTo);
    }
  }, [currenciesList]);

  // Update rates when from or to currencies update
  useEffect(() => {
    calculateConversion();
  }, [fromCurrency, toCurrency]);

  // Click outside listener for custom dropdown selectors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setShowFromPopover(false);
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setShowToPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger temporary toast notifier
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Convert math handler
  const calculateConversion = () => {
    setErrorMsg(null);
    const parsedAmount = parseFloat(amount);
    
    // Amount validations
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please provide a valid, positive transfer amount.");
      setConversionResult('0.00');
      return;
    }

    try {
      const { rates } = getRates(fromCurrency.code);
      const rate = rates[toCurrency.code] || 1;
      
      setCurrentRate(rate);
      setInverseRate(rate > 0 ? parseFloat((1 / rate).toFixed(5)) : 1);
      setConversionResult((parsedAmount * rate).toFixed(2));
    } catch (err) {
      setErrorMsg("Failed to synchronize conversion. FX Gateway is offline.");
    }
  };

  // Trigger loading spinner overlay
  const handleTriggerConvert = async (e) => {
    e.preventDefault();
    setIsConverting(true);
    
    // Simulate gateway API lag
    await new Promise((resolve) => setTimeout(resolve, 800));
    calculateConversion();
    setIsConverting(false);
    triggerToast("Exchange rates synchronized!");
  };

  // Swap currencies handler
  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Copy result output
  const handleCopyResult = () => {
    const textToCopy = `${amount} ${fromCurrency.code} = ${conversionResult} ${toCurrency.code}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => triggerToast("Conversion result copied to clipboard!"))
      .catch(() => triggerToast("Failed to copy result."));
  };

  // Share result link
  const handleShareResult = () => {
    const shareUrl = `${window.location.origin}/converter?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => triggerToast("Shareable configuration link copied!"))
      .catch(() => triggerToast("Failed to generate link."));
  };

  // Download PDF slip
  const handleDownloadReceipt = () => {
    const txId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}-2026`;
    const dateStr = new Date().toLocaleString();
    
    const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ApexExchange Transaction Receipt</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 40px; color: #0f172a; }
          .receipt-card { background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(15,23,42,0.06); padding: 40px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; }
          .brand { font-size: 26px; font-weight: 800; text-align: center; color: #2563eb; margin-bottom: 24px; letter-spacing: -0.5px; }
          .status-container { text-align: center; margin-bottom: 24px; }
          .success-stamp { border: 2px solid #10b981; color: #10b981; font-weight: 700; text-transform: uppercase; padding: 6px 16px; border-radius: 9999px; display: inline-block; font-size: 13px; letter-spacing: 0.5px; }
          .summary-title { font-size: 13px; color: #64748b; margin-top: 20px; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; }
          .summary-val { font-size: 26px; font-weight: 700; color: #0f172a; }
          .divider { border-bottom: 1px solid #e2e8f0; margin: 24px 0; }
          .meta-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 12px; }
          .meta-lbl { color: #64748b; }
          .meta-val { font-weight: 600; color: #0f172a; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px; }
          .print-btn { background: #2563eb; color: white; border: none; padding: 12px 20px; font-weight: 700; width: 100%; border-radius: 8px; cursor: pointer; margin-top: 15px; font-size: 14px; transition: background 0.2s; }
          .print-btn:hover { background: #1d4ed8; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="brand">ApexExchange</div>
          <div class="status-container">
            <span class="success-stamp">Approved / Rate Guaranteed</span>
          </div>
          <div class="summary-title">You Exchanged</div>
          <div class="summary-val">${amount} ${fromCurrency.code}</div>
          <div class="summary-title">You Received</div>
          <div class="summary-val">${conversionResult} ${toCurrency.code}</div>
          <div class="divider"></div>
          <div class="meta-row">
            <span class="meta-lbl">Transaction ID</span>
            <span class="meta-val">${txId}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Guaranteed Rate</span>
            <span class="meta-val">1 ${fromCurrency.code} = ${currentRate.toFixed(5)} ${toCurrency.code}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Inverse Rate</span>
            <span class="meta-val">1 ${toCurrency.code} = ${inverseRate.toFixed(5)} ${fromCurrency.code}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Margin Spread</span>
            <span class="meta-val">0.015% (Mid-Market)</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Broker Commission</span>
            <span class="meta-val" style="color: #10b981;">$0.00 (Free Account)</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Execution Stamp</span>
            <span class="meta-val">${dateStr}</span>
          </div>
          <button class="print-btn" onclick="window.print()">Print to PDF</button>
          <div class="footer">Thank you for exchanging with ApexExchange treasury networks.</div>
        </div>
      </body>
    </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ApexExchange_Receipt_${txId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast("PDF Receipt generated! Open down-loaded slip to print.");
  };

  // Autocomplete filters
  const filteredFromList = currenciesList.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredToList = currenciesList.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Currency Converter</h1>
        <p className="page-subtitle">Instantly compare and execute high-value multi-currency exchanges with verified mid-market quotes.</p>
      </div>

      <div className="converter-layout-grid">
        {/* Left Side: Dynamic Calculator Wrapper */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <Sparkles size={18} color="var(--primary)" />
              ApexExchange Calculator
            </div>
          </div>

          <form onSubmit={handleTriggerConvert} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Error notifications */}
            {errorMsg && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem' }}>
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Row: Amount */}
            <div className="input-group">
              <label htmlFor="amount-val">Amount to Exchanged</label>
              <div className="input-control-wrapper" style={{ backgroundColor: 'var(--bg-card)' }}>
                <input 
                  id="amount-val"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  style={{ fontSize: '1.2rem', padding: '14px' }}
                />
              </div>
            </div>

            {/* Selector Grid: From & To */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'center', gap: '12px' }}>
              
              {/* From currency select drop */}
              <div className="input-group">
                <label>From Currency</label>
                <div className="custom-selector-container" ref={fromRef}>
                  <button 
                    type="button" 
                    className="custom-select-btn"
                    onClick={() => { setShowFromPopover(!showFromPopover); setShowToPopover(false); setSearchQuery(''); }}
                  >
                    <span className="custom-select-btn-label">
                      <span className="currency-flag-circle" style={{ backgroundColor: fromCurrency.bg, color: '#ffffff' }}>
                        {fromCurrency.code.substring(0,2)}
                      </span>
                      {fromCurrency.code}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>▼</span>
                  </button>

                  {showFromPopover && (
                    <div className="custom-select-popover">
                      <div className="popover-search-wrapper">
                        <Search size={14} style={{ position: 'absolute', margin: '10px', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          className="popover-search-input" 
                          placeholder="Search currency code/name..."
                          style={{ paddingLeft: '28px' }}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="popover-list">
                        {filteredFromList.map(curr => (
                          <button
                            key={curr.code}
                            type="button"
                            className={`popover-item ${curr.code === fromCurrency.code ? 'selected' : ''}`}
                            onClick={() => { setFromCurrency(curr); setShowFromPopover(false); }}
                          >
                            <span>{curr.code} - {curr.name}</span>
                            <span style={{ fontWeight: 700 }}>{curr.symbol}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Swap action button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
                <button 
                  type="button" 
                  className="swap-circle-btn"
                  onClick={handleSwapCurrencies}
                  title="Swap currencies"
                >
                  <ArrowLeftRight size={16} />
                </button>
              </div>

              {/* To currency select drop */}
              <div className="input-group">
                <label>To Currency</label>
                <div className="custom-selector-container" ref={toRef}>
                  <button 
                    type="button" 
                    className="custom-select-btn"
                    onClick={() => { setShowToPopover(!showToPopover); setShowFromPopover(false); setSearchQuery(''); }}
                  >
                    <span className="custom-select-btn-label">
                      <span className="currency-flag-circle" style={{ backgroundColor: toCurrency.bg, color: '#ffffff' }}>
                        {toCurrency.code.substring(0,2)}
                      </span>
                      {toCurrency.code}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>▼</span>
                  </button>

                  {showToPopover && (
                    <div className="custom-select-popover">
                      <div className="popover-search-wrapper">
                        <Search size={14} style={{ position: 'absolute', margin: '10px', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          className="popover-search-input" 
                          placeholder="Search currency code/name..."
                          style={{ paddingLeft: '28px' }}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="popover-list">
                        {filteredToList.map(curr => (
                          <button
                            key={curr.code}
                            type="button"
                            className={`popover-item ${curr.code === toCurrency.code ? 'selected' : ''}`}
                            onClick={() => { setToCurrency(curr); setShowToPopover(false); }}
                          >
                            <span>{curr.code} - {curr.name}</span>
                            <span style={{ fontStyle: 'bold' }}>{curr.symbol}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Results preview */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Converted Value</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                  {conversionResult}
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {toCurrency.code}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                1 {fromCurrency.code} = {currentRate.toFixed(4)} {toCurrency.code}
              </div>
            </div>

            {/* Submit button */}
            <button 
              type="submit" 
              className="placeholder-btn"
              disabled={isConverting}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="spin-anim" size={18} />
                  Calculating Latest Rate...
                </>
              ) : (
                "Convert Exchange Rate"
              )}
            </button>
          </form>

          {/* Action strip bar */}
          <div className="action-buttons-strip">
            <button className="action-strip-btn" onClick={handleCopyResult} title="Copy result text">
              <Copy size={16} />
              Copy
            </button>
            <button className="action-strip-btn" onClick={handleShareResult} title="Copy share link">
              <Share2 size={16} />
              Share
            </button>
            <button className="action-strip-btn" onClick={handleDownloadReceipt} title="Download HTML/PDF invoice slip">
              <Download size={16} />
              Receipt PDF
            </button>
          </div>
        </div>

        {/* Right Side: Analysis Summary Cards */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <Info size={18} color="var(--primary)" />
              Conversion summary
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
            ApexExchange operates using interbank mid-market spreads. Standard enterprise profiles pay zero commission fees for trading G10 pairs.
          </p>

          <div className="converter-summary-card">
            <div className="summary-row">
              <span className="summary-lbl">Conversion Rate</span>
              <span className="summary-val">1 {fromCurrency.code} = {currentRate.toFixed(5)} {toCurrency.code}</span>
            </div>

            <div className="summary-row">
              <span className="summary-lbl">Inverted Rate</span>
              <span className="summary-val">1 {toCurrency.code} = {inverseRate.toFixed(5)} {fromCurrency.code}</span>
            </div>

            <div className="summary-row">
              <span className="summary-lbl">Operational Fees</span>
              <span className="summary-val" style={{ color: 'var(--accent)', fontWeight: 700 }}>$0.00 (Zero Commission)</span>
            </div>

            <div className="summary-row">
              <span className="summary-lbl">Spread Margin</span>
              <span className="summary-val">0.015% (Tight spread)</span>
            </div>

            <div className="summary-row">
              <span className="summary-lbl">Settlement Time</span>
              <span className="summary-val">Instant (Internal Clearing)</span>
            </div>

            <div className="summary-row">
              <span className="summary-lbl">Quote Guarantee</span>
              <span className="summary-val">30 Seconds remaining</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <span>Guaranteed quotes lock in rates, preventing execution losses from mid-market fluctuations.</span>
          </div>
        </div>
      </div>

      {/* Floating Animated Toast Banner */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`}>
        <Check size={16} color="var(--accent)" />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default Converter;
