import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Search, Bot, Plus, LogIn, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onSectionChange }) => {
  const { login, logout, authenticated, user } = usePrivy();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Explore Agents', icon: Search },
    { id: 'agents', label: 'My Agents', icon: Bot },
    { id: 'create', label: 'Create Agent', icon: Plus },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsMobileMenuOpen(false); // Close mobile menu when item is clicked
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Logo */}
        <div className="navbar-logo">
          <img 
            src="/xade.png" 
            alt="Xade" 
            style={{ 
              width: '88px', 
              height: '26px', 
              marginRight: '12px'
            }} 
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.textContent = '⚡ Xade';
            }}
          />
        </div>
        
        {/* Desktop Navigation */}
        <ul className="navbar-links desktop-only">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  className={`navbar-link ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon size={16} style={{ marginRight: '6px' }} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Right side - Auth & Mobile Menu Button */}
        <div className="navbar-right">
          {/* Authentication */}
          <div className="auth-section">
            {authenticated ? (
              <div className="user-info">
                <span className="wallet-address">
                  {user?.wallet?.address ? 
                    `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 
                    'Connected'
                  }
                </span>
                <button
                  onClick={logout}
                  className="btn btn-ghost logout-btn"
                  title="Disconnect Wallet"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="btn btn-primary connect-btn"
              >
                <LogIn size={16} />
                <span className="connect-text">Connect</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <ul className="mobile-nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    className={`mobile-nav-link ${activeSection === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <Icon size={18} style={{ marginRight: '8px' }} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
};
