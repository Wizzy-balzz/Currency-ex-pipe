import React, { useState, useEffect } from 'react';
import { 
  Newspaper, Search, Calendar, BookOpen, Clock, 
  ArrowUpRight, X, Info, Sparkles, HelpCircle, ChevronRight 
} from 'lucide-react';

const NEWS_DATABASE = [
  {
    id: 'n1',
    title: 'Federal Reserve Signals Interest Rate Cuts in Upcoming FOMC Session',
    summary: 'Chair Jerome Powell indicated that inflation is showing structural signs of stabilizing near target corridors, paving the way for benchmark rate cuts.',
    content: 'In a highly anticipated address, Federal Reserve Chairman Jerome Powell declared that the "time has come" for the central bank to adjust its benchmark interest rate policy. Citing a cooling labor market and inflation rates that are steadily approaching the Fed\'s target boundary of 2.0%, Powell suggested that the risks to the dual mandate are shifting. Analysts are now pricing in a 25 basis point reduction at the September FOMC session, which has led to a slight softening of the DXY Dollar Index against G10 majors like the Euro and the British Pound.',
    category: 'Central Banks',
    source: 'Bloomberg',
    time: '15 mins ago',
    impact: 'high',
    readTime: '4 min read',
    trending: true
  },
  {
    id: 'n2',
    title: 'ECB Governors Divided on Deposit Rate Cut Speeds as Inflation Consolidates',
    summary: 'European Central Bank governors are expressing differing outlooks regarding service sector wage drifts, raising questions about rate easing scope.',
    content: 'Following a modest interest rate reduction, members of the European Central Bank\'s Governing Council are locked in intense debates over the path of monetary policy for the remainder of the year. Hawkish governors from northern eurozone states are advocating for extreme caution, highlighting sticky service-sector price ticks and rising wage drifts across Germany and France. Conversely, representatives from southern member states warn that keeping rates in highly restrictive territory could severely choke economic growth. EUR/USD currency spreads continue to consolidate near 1.0910 amid these discussions.',
    category: 'Central Banks',
    source: 'Reuters',
    time: '1 hour ago',
    impact: 'medium',
    readTime: '3 min read',
    trending: true
  },
  {
    id: 'n3',
    title: 'Bank of Japan Raises overnight Call Rate Target, Unwinding Carry Trades',
    summary: 'The Japanese central bank raises baseline interest rates to 0.25%, triggering a major correction loop on carry trade spreads and pushing Yen quotes higher.',
    content: 'In a historic move, the Bank of Japan decided to raise its benchmark overnight call rate from 0-0.1% to a target of 0.25%. Governor Kazuo Ueda cited persistent wage growth and broadening price increases as signs that Japan is finally breaking free from its decades-long deflationary cycle. The decision immediately triggered a massive unwinding of JPY carry trades, causing the Japanese Yen to strengthen rapidly from 161.00 down to 154.50 USD/JPY. Global equity markets experienced brief volatility as leveraged funds adjusted margin assets.',
    category: 'Forex',
    source: 'Financial Times',
    time: '3 hours ago',
    impact: 'high',
    readTime: '5 min read',
    trending: true
  },
  {
    id: 'n4',
    title: 'Global Manufacturing Activity Contracts as S&P PMI Indices Slip',
    summary: 'S&P PMI statistics signal a cooling manufacturing corridor across major industrial zones, triggering safe-haven inflows to gold.',
    content: 'Manufacturing indexes across major global economies continue to show signs of structural fatigue. S&P Global’s manufacturing PMI indexes slipped further into contraction territory, indicating that higher baseline borrowing costs are starting to restrict capital investment. While this has heightened fears of an impending global slowdown, it has also accelerated expectations that central banks will initiate aggressive ease cycles, which has provided a boost to commodities and safe-haven government bonds.',
    category: 'Global Economy',
    source: 'Wall Street Journal',
    time: '5 hours ago',
    impact: 'medium',
    readTime: '3 min read',
    trending: false
  },
  {
    id: 'n5',
    title: 'UK Inflation Remains Resilient at 2.2% in June, Bank of England Easing in Doubt',
    summary: 'Consumer price index metrics in Britain hover near target boundaries, leaving BoE economists split on rate cuts.',
    content: 'The Office for National Statistics reported that the UK Consumer Prices Index (CPI) rose by 2.2% in the 12 months to June. While this is slightly above the Bank of England\'s official 2% target, it represents a substantial decline from double-digit peaks seen in 2023. Core inflation, which excludes volatile food and energy costs, remained sticky, causing the Bank of England MPC to proceed with extreme caution. Sterling remains resilient near 1.2850 GBP/USD.',
    category: 'Global Economy',
    source: 'BBC Finance',
    time: '8 hours ago',
    impact: 'low',
    readTime: '3 min read',
    trending: false
  },
  {
    id: 'n6',
    title: 'Bitcoin Consolidates Near $62,000 as Spot ETF Inflow Speeds Cool',
    summary: 'Crypto asset prices stabilize as investors monitor central bank liquidity guidelines and potential regulatory shifts.',
    content: 'Bitcoin and the broader cryptocurrency market continue to trade within a tight consolidation range. Analysts note that while institutional spot ETFs continue to accumulate Bitcoin on a net basis, the velocity of inflows has cooled. Macro economists believe that crypto markets are increasingly tracking G10 liquidity conditions, meaning that any aggressive ease campaigns by the Fed could serve as a primary catalyst for the next leg of digital asset expansions.',
    category: 'Crypto',
    source: 'CoinDesk',
    time: '12 hours ago',
    impact: 'low',
    readTime: '2 min read',
    trending: false
  }
];

const CATEGORIES = ['All News', 'Forex', 'Central Banks', 'Global Economy', 'Crypto'];

const News = () => {
  // Search & Filter state variables
  const [activeCategory, setActiveCategory] = useState('All News');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Article reading modal state variables
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Simulate initial load skeletons
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter News Articles array
  const filteredLatestNews = NEWS_DATABASE.filter(item => {
    // Category match
    const matchesCategory = 
      activeCategory === 'All News' || 
      item.category === activeCategory;

    // Search query match
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Filter Trending Articles array
  const trendingNews = NEWS_DATABASE.filter(item => item.trending);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Market News & Insights</h1>
        <p className="page-subtitle">Real-time monetary policy analysis, macroeconomic data releases, and interbank FX commentary.</p>
      </div>

      {/* Category Toggles and Search panel */}
      <div className="news-categories-row">
        <div className="news-pills-list">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`news-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ width: '320px', backgroundColor: 'var(--bg-input)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search headlines, sources..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 1. LOADING SKELETON */}
      {loading ? (
        <div className="news-layout-grid">
          <div className="news-cards-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="widget-card" style={{ height: '240px' }}>
                <div className="skeleton-pulse skeleton-title" style={{ width: '30%' }}></div>
                <div className="skeleton-pulse skeleton-text" style={{ width: '90%' }}></div>
                <div className="skeleton-pulse skeleton-text" style={{ width: '50%' }}></div>
              </div>
            ))}
          </div>
          <div className="widget-card" style={{ height: '360px' }}>
            <div className="skeleton-pulse skeleton-title" style={{ width: '50%' }}></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-pulse skeleton-text" style={{ height: '30px', marginBottom: '8px' }}></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main 2-column Grid */}
          <div className="news-layout-grid">
            
            {/* Left side: Latest News card grid */}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Newspaper size={18} color="var(--primary)" />
                Latest Market Releases
              </h2>
              
              {filteredLatestNews.length > 0 ? (
                <div className="news-cards-grid">
                  {filteredLatestNews.map(item => (
                    <article 
                      key={item.id} 
                      className="news-card"
                      onClick={() => setSelectedArticle(item)}
                    >
                      {/* Placeholder thumbnail header */}
                      <div className="news-card-banner">
                        {item.category.toUpperCase()}
                      </div>
                      
                      <div className="news-card-body">
                        <div className="news-meta-row">
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{item.time}</span>
                        </div>

                        <h3 className="news-title-link">{item.title}</h3>
                        <p className="news-desc-snippet">{item.summary}</p>

                        <div className="news-card-footer" style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                          <span className={`news-badge-impact ${item.impact}`}>
                            {item.impact} impact
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <BookOpen size={12} />
                            {item.readTime}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="widget-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <HelpCircle size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No articles match your search parameters.</p>
                </div>
              )}
            </div>

            {/* Right side: Trending news sidebar */}
            <div className="widget-card">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--warning)" />
                Trending Analysis
              </h2>

              <div className="trending-news-list">
                {trendingNews.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className="trending-news-row"
                    onClick={() => setSelectedArticle(item)}
                  >
                    <span className="trending-num-lbl">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="trending-headline-lbl">{item.title}</h3>
                      <div className="news-meta-row" style={{ fontSize: '0.65rem' }}>
                        <span>{item.source}</span>
                        <span>•</span>
                        <span className={`news-badge-impact ${item.impact}`} style={{ textTransform: 'capitalize', padding: '0', background: 'transparent' }}>
                          {item.impact} Impact
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)' }}>
                <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Impact ratings measure potential quote volatility in the corresponding currency corridor.</span>
              </div>
            </div>

          </div>
        </>
      )}

      {/* 3. FULL READ MODAL OVERLAY */}
      {selectedArticle && (
        <div className="portfolio-modal-overlay">
          <div className="portfolio-modal" style={{ maxWidth: '600px' }}>
            <div className="portfolio-modal-header">
              <span className={`news-badge-impact ${selectedArticle.impact}`} style={{ fontSize: '0.7rem' }}>
                {selectedArticle.impact} Market Impact
              </span>
              <button className="portfolio-modal-close" onClick={() => setSelectedArticle(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="news-meta-row" style={{ fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedArticle.source}</span>
                <span>•</span>
                <span>{selectedArticle.time}</span>
                <span>•</span>
                <span>{selectedArticle.readTime}</span>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.3' }}>
                {selectedArticle.title}
              </h2>

              <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                {selectedArticle.content}
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', marginTop: '10px', paddingTop: '14px', borderTop: '1px dashed var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Category: <strong>{selectedArticle.category}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  Guaranteed Rate Feed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
