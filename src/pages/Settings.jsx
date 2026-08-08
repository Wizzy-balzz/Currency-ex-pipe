import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, Save, RefreshCw, AlertTriangle, 
  HelpCircle, Info, Bell, ShieldCheck, Languages, Sparkles 
} from 'lucide-react';

const LANGUAGE_DATABASE = [
  { code: 'en', name: 'English (US)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' }
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'CNH', 'NZD'];

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  // Settings states synchronized with localStorage
  const [defaultCurrency, setDefaultCurrency] = useState(() => {
    return localStorage.getItem('apex_default_currency') || 'USD';
  });

  const [systemLanguage, setSystemLanguage] = useState(() => {
    return localStorage.getItem('apex_system_language') || 'en';
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('apex_system_notifications');
    return saved ? JSON.parse(saved) : { EmailAlerts: true, SMSAlerts: false, PushAlerts: true };
  });

  // Success toast states
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Trigger floating alert toast
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Toggle notification switches
  const handleToggleSwitch = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  // Theme dropdown changes handler
  const handleThemeChange = (newTheme) => {
    if (newTheme !== theme) {
      toggleTheme();
      triggerToast(`Theme switched to ${newTheme} mode.`);
    }
  };

  // Save Settings handler
  const handleSaveSettings = (e) => {
    e.preventDefault();
    
    // Save to localStorage
    localStorage.setItem('apex_default_currency', defaultCurrency);
    localStorage.setItem('apex_system_language', systemLanguage);
    localStorage.setItem('apex_system_notifications', JSON.stringify(notifications));

    triggerToast("System settings saved successfully!");
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
        <p className="page-subtitle">Configure theme preferences, default currency quotes, local languages, and notification schedules.</p>
      </div>

      {/* Main Form container */}
      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 2-column Grid: General on Left, Notifications on Right */}
        <div className="portfolio-layout-grid">
          
          {/* Left Column: General preferences */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <Languages size={18} color="var(--primary)" />
                General Preferences
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Theme option */}
              <div className="form-group">
                <label htmlFor="themeSelect">Display Theme</label>
                <select 
                  id="themeSelect"
                  className="portfolio-input-field" 
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              {/* Default currency */}
              <div className="form-group">
                <label htmlFor="defaultCurrencySelect">Default Base Currency</label>
                <select 
                  id="defaultCurrencySelect"
                  className="portfolio-input-field" 
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                >
                  {CURRENCIES.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              {/* Language choice */}
              <div className="form-group">
                <label htmlFor="languageSelect">System Language</label>
                <select 
                  id="languageSelect"
                  className="portfolio-input-field" 
                  value={systemLanguage}
                  onChange={(e) => setSystemLanguage(e.target.value)}
                >
                  {LANGUAGE_DATABASE.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Notification switches */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <Bell size={18} color="var(--primary)" />
                Notification Settings
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.5' }}>
              Select your channels to receive real-time rate alert warnings, transaction invoice receipts, and compliance logs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Email Alerts toggle switch */}
              <div className="settings-toggle-row">
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Email Alerts</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive conversion PDF receipts and logs via email.</span>
                </div>
                <label className="toggle-switch-wrapper" htmlFor="emailAlertsCheck">
                  <input 
                    id="emailAlertsCheck"
                    type="checkbox" 
                    checked={notifications.EmailAlerts}
                    onChange={() => handleToggleSwitch('EmailAlerts')}
                  />
                  <span className="toggle-switch-slider"></span>
                </label>
              </div>

              {/* SMS Alerts toggle switch */}
              <div className="settings-toggle-row">
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>SMS Notifications</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive urgent text alerts when rates cross target barriers.</span>
                </div>
                <label className="toggle-switch-wrapper" htmlFor="smsAlertsCheck">
                  <input 
                    id="smsAlertsCheck"
                    type="checkbox" 
                    checked={notifications.SMSAlerts}
                    onChange={() => handleToggleSwitch('SMSAlerts')}
                  />
                  <span className="toggle-switch-slider"></span>
                </label>
              </div>

              {/* Push Alerts toggle switch */}
              <div className="settings-toggle-row">
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Push Notifications</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Display instant warnings inside your active browser context.</span>
                </div>
                <label className="toggle-switch-wrapper" htmlFor="pushAlertsCheck">
                  <input 
                    id="pushAlertsCheck"
                    type="checkbox" 
                    checked={notifications.PushAlerts}
                    onChange={() => handleToggleSwitch('PushAlerts')}
                  />
                  <span className="toggle-switch-slider"></span>
                </label>
              </div>

            </div>
          </div>

        </div>

        {/* Global Save Button actions */}
        <div className="widget-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', alignItems: 'center' }}>
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            <span>Settings are synchronized locally in your current browser session.</span>
          </div>

          <button 
            type="submit" 
            className="placeholder-btn"
            style={{ padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>

      </form>

      {/* Floating Animated Toast Banner */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`}>
        <ShieldCheck size={16} color="var(--accent)" />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default Settings;
