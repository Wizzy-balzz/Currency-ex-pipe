import React, { useState } from 'react';
import { 
  HelpCircle, MessageSquare, ChevronDown, ChevronUp, Send, 
  ShieldAlert, Sparkles, CheckCircle2, Ticket 
} from 'lucide-react';

const FAQ_DATABASE = [
  {
    id: 'f1',
    question: 'How are the live exchange rates derived?',
    answer: 'Rates are simulated using an FX broker gateway drift simulator (mockFxApi.js). It starts with standard baseline ratios relative to USD and drifts daily spreads with G10 spreads and volatilities.'
  },
  {
    id: 'f2',
    question: 'How do I add currency pairs to my Dashboard Watchlist?',
    answer: 'Navigate to the Starred Watchlist (Favorites) page in the sidebar. Select your base rate and toggle currency checkboxes. The selected pairs will instantly update on both the Favorites and Dashboard pages.'
  },
  {
    id: 'f3',
    question: 'How do rate alerts work and will I receive push notifications?',
    answer: 'Rate alerts monitor cross-rate ratios against your target thresholds. You can test triggers by clicking "Simulate Market Tick" on the Alerts page to randomly drift mock rates. Fired alerts slide up as orange status toasts.'
  },
  {
    id: 'f4',
    question: 'Is my Portfolio Tracker balance stored securely?',
    answer: 'Yes. All wallet asset balances, average purchase prices, and ROI records are saved directly inside your local browser\'s HTML5 localStorage cache. No data is transmitted to external servers.'
  }
];

const HelpCenter = () => {
  // Accordion state
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Form states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('General');
  const [ticketSeverity, setTicketSeverity] = useState('Low');
  const [ticketDesc, setTicketDesc] = useState('');
  const [formError, setFormError] = useState(null);

  // Submitted tickets logs
  const [ticketsList, setTicketsList] = useState([]);

  // Toast notifications states
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Toggle FAQ accordion
  const handleToggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Submit Support Ticket
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      setFormError("Ticket Subject and Description details are required.");
      return;
    }

    const ticketId = `TK-${Math.floor(Math.random() * 9000) + 1000}`;
    const newTicket = {
      id: ticketId,
      subject: ticketSubject,
      category: ticketCategory,
      severity: ticketSeverity,
      desc: ticketDesc,
      status: 'Open',
      date: new Date().toLocaleDateString()
    };

    setTicketsList([newTicket, ...ticketsList]);
    setTicketSubject('');
    setTicketDesc('');
    
    // Trigger toast
    setToastMsg(`Support Ticket Created! ID: ${ticketId}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Help Center & Support</h1>
        <p className="page-subtitle">Access interbank clearing documentation, regulatory FAQ accordions, or log technical tickets.</p>
      </div>

      {/* Grid: FAQ Accordion on Left, Ticket Form on Right */}
      <div className="portfolio-layout-grid">
        
        {/* Left Side: FAQ list */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <HelpCircle size={18} color="var(--primary)" />
              Frequently Asked Questions
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQ_DATABASE.map(faq => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div 
                  key={faq.id} 
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)', 
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-app)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleFaq(faq.id)}
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '14px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isOpen && (
                    <div style={{ 
                      padding: '0 16px 14px', 
                      fontSize: '0.8rem', 
                      color: 'var(--text-muted)', 
                      lineHeight: '1.6',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '12px',
                      backgroundColor: 'var(--bg-card)'
                    }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Ticket Submission Form */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <MessageSquare size={18} color="var(--primary)" />
              File Technical Support Ticket
            </div>
          </div>

          <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {formError && (
              <div style={{ padding: '8px 12px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.8rem' }}>
                {formError}
              </div>
            )}

            {/* Subject */}
            <div className="form-group">
              <label htmlFor="ticketSubject">Ticket Subject</label>
              <input 
                id="ticketSubject"
                type="text" 
                placeholder="e.g., Rates alert push failure"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
              />
            </div>

            {/* Category and Severity splits */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ticketCategory">Category</label>
                <select 
                  id="ticketCategory"
                  value={ticketCategory} 
                  onChange={(e) => setTicketCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Rates/Alerts">Rates / Alerts</option>
                  <option value="Wallet/Assets">Wallet / Portfolio</option>
                  <option value="API Integration">API Integration</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ticketSeverity">Severity Level</label>
                <select 
                  id="ticketSeverity"
                  value={ticketSeverity} 
                  onChange={(e) => setTicketSeverity(e.target.value)}
                >
                  <option value="Low">Low (Operational Question)</option>
                  <option value="Medium">Medium (Incorrect Spreads)</option>
                  <option value="High">High (Settlement Failures)</option>
                </select>
              </div>
            </div>

            {/* Description details */}
            <div className="form-group">
              <label htmlFor="ticketDesc">Description Details</label>
              <textarea 
                id="ticketDesc"
                rows="3"
                placeholder="Describe structural conditions of the bug..."
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                style={{ 
                  padding: '10px', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button 
              type="submit" 
              className="placeholder-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            >
              <Send size={14} />
              Submit Ticket
            </button>
          </form>
        </div>

      </div>

      {/* Submitted tickets ledger feed (Visible below form if user submits tickets) */}
      {ticketsList.length > 0 && (
        <div className="widget-card" style={{ marginTop: '24px' }}>
          <div className="widget-header">
            <div className="widget-title">
              <Ticket size={18} color="var(--primary)" />
              Active Diagnostic Tickets ({ticketsList.length})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ticketsList.map(tick => (
              <div 
                key={tick.id} 
                className="triggered-log-row" 
                style={{ 
                  backgroundColor: 'var(--bg-app)', 
                  borderLeft: '4px solid var(--primary)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div className="triggered-log-details">
                  <span className="triggered-log-title">
                    [{tick.id}] {tick.subject}
                  </span>
                  <span className="triggered-log-time">
                    Category: {tick.category} • Severity: {tick.severity} • Submitted: {tick.date}
                  </span>
                </div>
                <span className="badge-status active" style={{ fontSize: '0.7rem', padding: '2px 8px', textTransform: 'uppercase' }}>
                  {tick.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom informational guidelines tip banner */}
      <div style={{ marginTop: '24px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
        <Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span>
          Support desk ticks are simulated. Tickets logged stay in the browser state during your current session.
        </span>
      </div>

      {/* Floating Animated Toast Banner */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`}>
        <CheckCircle2 size={16} color="var(--accent)" />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default HelpCenter;
