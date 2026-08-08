import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Pages Import
import Dashboard from './pages/Dashboard';
import Converter from './pages/Converter';
import ExchangeRates from './pages/ExchangeRates';
import History from './pages/History';
import Comparison from './pages/Comparison';
import Portfolio from './pages/Portfolio';
import Favorites from './pages/Favorites';
import Alerts from './pages/Alerts';
import News from './pages/News';
import Countries from './pages/Countries';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import About from './pages/About';
import HelpCenter from './pages/HelpCenter';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="converter" element={<Converter />} />
            <Route path="rates" element={<ExchangeRates />} />
            <Route path="history" element={<History />} />
            <Route path="comparison" element={<Comparison />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="news" element={<News />} />
            <Route path="countries" element={<Countries />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="about" element={<About />} />
            <Route path="help" element={<HelpCenter />} />
            {/* Catch-all route redirecting to dashboard */}
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
