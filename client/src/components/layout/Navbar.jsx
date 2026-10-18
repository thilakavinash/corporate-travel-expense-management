import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';

const Navbar = ({ onMobileMenuToggle, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navbarStyle = {
    position: 'fixed',
    top: 0,
    left: '0',
    right: '0',
    height: '64px',
    backgroundColor: 'var(--color-white)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 'var(--z-index-sticky)',
    paddingLeft: sidebarCollapsed ? '80px' : '276px',
    transition: 'padding-left 200ms ease-in-out',
  };

  const mobileMenuButtonStyle = {
    display: 'none',
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'var(--color-gray-700)',
  };

  const userMenuStyle = {
    position: 'absolute',
    top: '100%',
    right: '24px',
    marginTop: '8px',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-lg)',
    minWidth: '200px',
    zIndex: 'var(--z-index-dropdown)',
  };

  const userMenuItemStyle = {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--color-border-light)',
    fontSize: '14px',
    color: 'var(--color-gray-700)',
    transition: 'background-color 150ms ease-in-out',
  };

  const userMenuItemHoverStyle = {
    backgroundColor: 'var(--color-gray-50)',
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div style={navbarStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMobileMenuToggle}
          style={mobileMenuButtonStyle}
          className="mobile-menu-button"
        >
          ☰
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <NotificationBell />

        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-in-out',
            }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-gray-700)' }}>
                {user?.firstName} {user?.lastName}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-gray-500)', textTransform: 'capitalize' }}>
                {user?.role}
              </span>
            </div>
          </div>

          {showUserMenu && (
            <div style={userMenuStyle}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-gray-700)' }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                  {user?.email}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-gray-400)', marginTop: '4px', textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
              <div
                style={userMenuItemStyle}
                onClick={handleLogout}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, userMenuItemHoverStyle)}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
