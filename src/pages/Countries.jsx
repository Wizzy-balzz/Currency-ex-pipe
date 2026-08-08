import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Search, ArrowLeftRight, HelpCircle, 
  Sparkles, Info, Users, Landmark, Coins 
} from 'lucide-react';

import { COUNTRIES_REGISTRY } from '../utils/countryDatabase';

const COUNTRIES_DATABASE = COUNTRIES_REGISTRY;

const REGIONS = ['All Regions', 'Europe', 'Asia', 'Americas', 'Oceania', 'Africa'];

const Countries = () => {
  const navigate = useNavigate();

  // Autocomplete search states
  const [activeRegion, setActiveRegion] = useState('All Regions');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [countriesList, setCountriesList] = useState(COUNTRIES_DATABASE);

  // Load countries dynamically from live Rest Countries API
  useEffect(() => {
    const loadLiveCountries = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all');
        const data = await res.json();
        if (Array.isArray(data)) {
          const list = data.map(c => {
            if (!c.currencies) return null;
            const curCode = Object.keys(c.currencies)[0];
            return {
              flag: c.flag || '🏳️',
              name: c.name.common,
              capital: c.capital ? c.capital[0] : 'N/A',
              population: c.population >= 1e9 
                ? (c.population / 1e9).toFixed(2) + 'B' 
                : c.population >= 1e6 
                  ? (c.population / 1e6).toFixed(1) + 'M' 
                  : c.population.toLocaleString(),
              currency: curCode,
              symbol: c.currencies[curCode].symbol || curCode,
              region: c.region === 'Americas' ? 'Americas' : c.region
            };
          }).filter(Boolean);
          list.sort((a, b) => a.name.localeCompare(b.name));
          setCountriesList(list);
        }
      } catch (err) {
        console.warn("Failed to load live country data. Using local database.", err);
      } finally {
        setLoading(false);
      }
    };
    loadLiveCountries();
  }, []);

  // Handle conversion redirect
  const handleNavigateTrade = (quoteCode) => {
    navigate(`/converter?amount=1000&from=USD&to=${quoteCode}`);
  };

  // Filter countries array
  const filteredCountries = countriesList.filter(item => {
    // Region match
    const matchesRegion = 
      activeRegion === 'All Regions' || 
      item.region === activeRegion;

    // Search query match
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.currency.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRegion && matchesSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Supported Countries</h1>
        <p className="page-subtitle">Inspect sovereign regions, operational currencies, capital identifiers, and clearing codes supported by our network.</p>
      </div>

      {/* Filter and Search controls panel */}
      <div className="news-categories-row">
        <div className="news-pills-list">
          {REGIONS.map(reg => (
            <button
              key={reg}
              type="button"
              className={`news-pill ${activeRegion === reg ? 'active' : ''}`}
              onClick={() => setActiveRegion(reg)}
            >
              {reg}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ width: '320px', backgroundColor: 'var(--bg-input)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search country, capital, currency..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 1. LOADING SKELETON */}
      {loading ? (
        <div className="countries-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="widget-card" style={{ height: '220px' }}>
              <div className="skeleton-pulse skeleton-title" style={{ width: '50%' }}></div>
              <div className="skeleton-pulse skeleton-text" style={{ width: '80%' }}></div>
              <div className="skeleton-pulse skeleton-text" style={{ width: '60%' }}></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Countries cards grid */}
          {filteredCountries.length > 0 ? (
            <div className="countries-grid">
              {filteredCountries.map(item => (
                <div key={item.name} className="country-card">
                  
                  {/* Card Header: Flag & Country Name */}
                  <div className="country-card-header">
                    <span className="country-flag-emoji" role="img" aria-label={`Flag of ${item.name}`}>
                      {item.flag}
                    </span>
                    <h2 className="country-name-lbl">{item.name}</h2>
                  </div>

                  {/* Card Body: Capitals, Population, Currency specifications */}
                  <div className="country-card-body">
                    <div className="country-meta-item">
                      <span className="country-meta-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Landmark size={12} /> Capital
                      </span>
                      <span className="country-meta-val">{item.capital}</span>
                    </div>

                    <div className="country-meta-item">
                      <span className="country-meta-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} /> Population
                      </span>
                      <span className="country-meta-val">{item.population}</span>
                    </div>

                    <div className="country-meta-item">
                      <span className="country-meta-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={12} /> Region
                      </span>
                      <span className="country-meta-val">{item.region}</span>
                    </div>

                    <div className="country-meta-item">
                      <span className="country-meta-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Coins size={12} /> Currency
                      </span>
                      <span className="country-meta-val">
                        {item.currency} ({item.symbol})
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Quick converter trigger redirect */}
                  <div className="country-card-actions">
                    <button 
                      className="placeholder-btn"
                      onClick={() => handleNavigateTrade(item.currency)}
                      title={`Go to converter with quote pre-filled in ${item.currency}`}
                    >
                      <ArrowLeftRight size={12} />
                      Trade {item.currency} Now
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="widget-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <HelpCircle size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h3>No countries match your search parameters</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                Verify spelling parameters or clear continent filters to retry.
              </p>
            </div>
          )}

          {/* Bottom guidelines informational banner */}
          <div style={{ marginTop: '24px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
            <Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>
              Supported country listings detailed correspond to interbank clearing rails mapped inside our payment nodes.
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default Countries;
