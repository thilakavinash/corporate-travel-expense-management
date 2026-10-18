import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({ message = 'Something went wrong', onRetry, title = 'Error' }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 32px',
    minHeight: '200px',
    textAlign: 'center',
  };

  const iconStyle = {
    color: 'var(--color-danger-500)',
    marginBottom: '16px',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--color-text)',
    marginBottom: '8px',
  };

  const messageStyle = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    marginBottom: '24px',
    maxWidth: '400px',
    lineHeight: '1.5',
  };

  return (
    <div style={containerStyle}>
      <AlertCircle size={48} style={iconStyle} />
      <h3 style={titleStyle}>{title}</h3>
      <p style={messageStyle}>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
