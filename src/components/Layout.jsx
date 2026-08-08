import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { Menu, Coins } from 'lucide-react';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileOpen = () => {
    setMobileOpen(!isMobileOpen);
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header (only visible on mobile screens) */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={24} color="#3b82f6" />
          <span className="mobile-logo">ApexExchange</span>
        </div>
        <button 
          className="mobile-hamburger" 
          onClick={toggleMobileOpen}
          aria-label="Open mobile menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Navigation Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Page Layout Wrapper */}
      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Navbar toggleSidebar={toggleSidebar} toggleMobileOpen={toggleMobileOpen} />
        
        <main className="page-container">
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
