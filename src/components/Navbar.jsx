import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon, Bell, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar, toggleMobileOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button 
          className="sidebar-toggle-btn" 
          onClick={toggleSidebar}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        
        <div className="search-box">
          <Search size={18} className="search-icon" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search transactions, alerts..." />
        </div>
      </div>

      <div className="navbar-right">
        <button 
          className="icon-btn" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="icon-btn" title="View Notifications" aria-label="Notifications">
          <Bell size={20} />
          <span className="badge-dot"></span>
        </button>

        <div className="profile-widget" onClick={handleProfileClick} title="User Profile">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100" 
            alt="User profile avatar" 
            className="profile-img" 
          />
          <div className="profile-info">
            <span className="profile-name">Sarah Jenkins</span>
            <span className="profile-role">Treasury Officer</span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
