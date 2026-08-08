import React, { useState } from 'react';
import { 
  Info, Cpu, CheckSquare, Sparkles, Terminal, Activity, 
  Layers, Settings, ShieldCheck, Database 
} from 'lucide-react';

const About = () => {
  const [pinging, setPinging] = useState(false);
  const [latency, setLatency] = useState(null);

  // Live latency ping simulator
  const handlePingTest = () => {
    setPinging(true);
    setLatency(null);
    setTimeout(() => {
      setPinging(false);
      setLatency(Math.floor(Math.random() * 8) + 8); // Drift between 8ms and 15ms
    }, 700);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">About the Platform</h1>
        <p className="page-subtitle">Architecture guidelines, clearing engine nodes, and system dependencies.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Platform Overview */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <Info size={18} color="var(--primary)" />
              ApexExchange System Core
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            ApexExchange is a high-availability G10 interbank clearing simulation terminal built in React. The platform mirrors corporate treasury controls, multi-currency spot conversions, volatility analytics sparklines, and risk limits ledgers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <div className="portfolio-stat-box" style={{ padding: '14px' }}>
              <span className="history-stat-lbl">Active Engine</span>
              <span className="portfolio-stat-val" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>React 18.3</span>
            </div>
            <div className="portfolio-stat-box" style={{ padding: '14px' }}>
              <span className="history-stat-lbl">Bundling System</span>
              <span className="portfolio-stat-val" style={{ fontSize: '1.2rem' }}>Vite & Rollup</span>
            </div>
            <div className="portfolio-stat-box" style={{ padding: '14px' }}>
              <span className="history-stat-lbl">Global Latency</span>
              <span className="portfolio-stat-val" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>Sub-15ms</span>
            </div>
          </div>
        </div>

        {/* 2-column Grid: Tech Stack vs Latency ping */}
        <div className="portfolio-layout-grid">
          
          {/* Tech stack */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <Layers size={18} color="var(--primary)" />
                Operational Technologies Stack
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Cpu size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Chart.js Data Visualization</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Renders historical walks, comparison correlations, and allocation charts.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Terminal size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Lucide Icons Pack</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Universal, theme-adaptive vectors for controls and navigations.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Settings size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Vanilla CSS variables</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Premium layout colors, layouts, glassmorphic headers, and dark mode toggles.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Database size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>HTML5 LocalStorage Caches</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Synchronizes wallet assets, watchlist stars, and rate threshold variables.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node Latency tester */}
          <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
            <div>
              <div className="widget-header">
                <div className="widget-title">
                  <Activity size={18} color="var(--primary)" />
                  Interbank Node Handshake Ping
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Send a diagnostics handshake ping to the mock interbank rates gateway to check current connection speed.
              </p>
            </div>

            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', margin: '24px 0' }}>
              {pinging ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={24} className="spin-anim" color="var(--primary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pinging clearing node...</span>
                </div>
              ) : latency ? (
                <div style={{ textCenter: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{latency}ms</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Connection Secure & Stable
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gateway offline test ready</span>
              )}
            </div>

            <button 
              type="button" 
              className="placeholder-btn" 
              style={{ width: '100%', padding: '12px' }}
              onClick={handlePingTest}
              disabled={pinging}
            >
              Check System Latency
            </button>
          </div>

        </div>

        {/* Bottom informational guidelines tip banner */}
        <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
          <Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>
            System is simulated inside local browser sandboxes. All rates and walks are generated locally without external telemetry connections.
          </span>
        </div>

      </div>
    </div>
  );
};

export default About;
