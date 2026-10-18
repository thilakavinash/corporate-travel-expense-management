import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Loading...', size = 'base' }) => {
  const sizeStyles = {
    sm: {
      iconSize: 24,
      fontSize: '12px',
      padding: '32px 16px',
    },
    base: {
      iconSize: 40,
      fontSize: '14px',
      padding: '64px 32px',
    },
    lg: {
      iconSize: 56,
      fontSize: '16px',
      padding: '96px 48px',
    },
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: sizeStyles[size].padding,
    minHeight: '200px',
  };

  const messageStyle = {
    fontSize: sizeStyles[size].fontSize,
    color: 'var(--color-text-secondary)',
    marginTop: '16px',
    fontWeight: '500',
  };

  return (
    <div style={containerStyle}>
      <Loader2 className="animate-spin" size={sizeStyles[size].iconSize} style={{ color: 'var(--color-primary)' }} />
      <p style={messageStyle}>{message}</p>
    </div>
  );
};

export default LoadingState;
