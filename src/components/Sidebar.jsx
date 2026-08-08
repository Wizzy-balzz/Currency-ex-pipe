import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ArrowLeftRight, TrendingUp, History, GitCompare, 
  Wallet, Star, BellRing, Newspaper, Globe, BarChart3, Settings, 
  User, Info, HelpCircle, Coins, X
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/converter', label: 'Converter', icon: ArrowLeftRight },
  { path: '/rates', label: 'Exchange Rates', icon: TrendingUp },
  { path: '/history', label: 'History', icon: History },
  { path: '/comparison', label: 'Comparison', icon: GitCompare },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/favorites', label: 'Favorites', icon: Star },
  { path: '/alerts', label: 'Alerts', icon: BellRing },
  { path: '/news', label: 'News', icon: Newspaper },
  { path: '/countries', label: 'Countries', icon: Globe },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/about', label: 'About', icon: Info },
  { path: '/help', label: 'Help Center', icon: HelpCircle }
];

const Sidebar = ({ isCollapsed, isMobileOpen, setMobileOpen }) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Coins size={28} color="#3b82f6" />
        {!isCollapsed && <span className="sidebar-logo">ApexExchange</span>}
        {isMobileOpen && (
          <button 
            className="sidebar-toggle-btn" 
            style={{ marginLeft: 'auto', color: '#ffffff' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink 
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
