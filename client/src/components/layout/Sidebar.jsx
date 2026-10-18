import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: collapsed ? '64px' : '260px',
    backgroundColor: 'var(--color-white)',
    borderRight: '1px solid var(--color-border)',
    transition: 'width 200ms ease-in-out',
    zIndex: 'var(--z-index-fixed)',
    display: 'flex',
    flexDirection: 'column',
  };

  const logoStyle = {
    padding: collapsed ? '16px' : '24px',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '12px',
    height: '64px',
  };

  const logoTextStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  const navStyle = {
    flex: 1,
    padding: '16px 8px',
    overflowY: 'auto',
  };

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '4px',
    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
    color: isActive ? 'var(--color-primary-dark)' : 'var(--color-gray-600)',
    transition: 'all 150ms ease-in-out',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  });

  const navItemHoverStyle = {
    backgroundColor: 'var(--color-gray-100)',
  };

  const iconStyle = {
    fontSize: '20px',
    minWidth: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '500',
    opacity: collapsed ? 0 : 1,
    transition: 'opacity 150ms ease-in-out',
  };

  const footerStyle = {
    padding: '16px',
    borderTop: '1px solid var(--color-border)',
  };

  // Role-based navigation items
  const getNavItems = () => {
    if (user?.role === 'employee') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/my-travel-requests', label: 'My Travel', icon: '✈️' },
        { path: '/add-expense', label: 'Add Expense', icon: '💳' },
        { path: '/my-expenses', label: 'My Expenses', icon: '💰' },
        { path: '/create-reimbursement', label: 'Create Reimbursement', icon: '📝' },
        { path: '/my-reimbursements', label: 'My Reimbursements', icon: '💵' },
        { path: '/analytics', label: 'My Analytics', icon: '📈' },
        { path: '/reports', label: 'My Reports', icon: '📋' },
        { path: '/logout', label: 'Logout', icon: '🚪', action: true },
      ];
    }

    if (user?.role === 'manager') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/pending-approvals', label: 'Travel Approvals', icon: '✅' },
        { path: '/logout', label: 'Logout', icon: '🚪', action: true },
      ];
    }

    if (user?.role === 'finance') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/expense-review', label: 'Expense Review', icon: '💳' },
        { path: '/reimbursement-review', label: 'Reimbursements', icon: '💵' },
        { path: '/analytics', label: 'Analytics', icon: '📈' },
        { path: '/reports', label: 'Reports', icon: '📋' },
        { path: '/logout', label: 'Logout', icon: '🚪', action: true },
      ];
    }

    if (user?.role === 'admin') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/user-management', label: 'User Management', icon: '👥' },
        { path: '/analytics', label: 'Analytics', icon: '📈' },
        { path: '/reports', label: 'Reports', icon: '📋' },
        { path: '/audit-logs', label: 'Audit Logs', icon: '🔍' },
        { path: '/logout', label: 'Logout', icon: '🚪', action: true },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const handleNavClick = (item) => {
    if (item.action) {
      if (item.path === '/logout') {
        logout();
        navigate('/login');
      }
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/logout') {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>
        <span style={{ fontSize: '24px' }}>✈️</span>
        {!collapsed && <span style={logoTextStyle}>TravelExpense</span>}
      </div>
      <nav style={navStyle}>
        {navItems.map((item) => (
          <div
            key={item.path}
            style={{
              ...navItemStyle(isActive(item.path)),
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                Object.assign(e.currentTarget.style, navItemHoverStyle);
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onClick={() => handleNavClick(item)}
            title={collapsed ? item.label : ''}
          >
            <span style={iconStyle}>{item.icon}</span>
            <span style={labelStyle}>{item.label}</span>
          </div>
        ))}
      </nav>
      <div style={footerStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
          }}
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <span style={{ fontSize: '18px' }}>
            {collapsed ? '▶' : '◀'}
          </span>
          {!collapsed && <span style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>Collapse</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
