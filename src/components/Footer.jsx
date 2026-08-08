import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div>
        &copy; {currentYear} ApexExchange Inc. All rights reserved.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
          <ShieldCheck size={16} />
          System Status: Operational
        </span>
        <a href="/help" style={{ textDecoration: 'underline' }}>Privacy Policy</a>
        <a href="/help" style={{ textDecoration: 'underline' }}>Terms of Service</a>
      </div>
    </footer>
  );
};

export default Footer;
