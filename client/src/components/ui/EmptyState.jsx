import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no items to display at this time.',
  action,
  onAction,
  size = 'base'
}) => {
  const sizeStyles = {
    sm: {
      iconSize: 32,
      titleSize: '16px',
      descriptionSize: '13px',
      padding: '32px 16px',
    },
    base: {
      iconSize: 48,
      titleSize: '18px',
      descriptionSize: '14px',
      padding: '64px 32px',
    },
    lg: {
      iconSize: 64,
      titleSize: '20px',
      descriptionSize: '16px',
      padding: '96px 48px',
    },
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: sizeStyles[size].padding,
    textAlign: 'center',
  };

  const iconStyle = {
    color: 'var(--color-text-tertiary)',
    marginBottom: '16px',
  };

  const titleStyle = {
    fontSize: sizeStyles[size].titleSize,
    fontWeight: '600',
    color: 'var(--color-text)',
    marginBottom: '8px',
  };

  const descriptionStyle = {
    fontSize: sizeStyles[size].descriptionSize,
    color: 'var(--color-text-secondary)',
    marginBottom: '24px',
    maxWidth: '400px',
    lineHeight: '1.5',
  };

  return (
    <div style={containerStyle}>
      <Icon size={sizeStyles[size].iconSize} style={iconStyle} />
      <h3 style={titleStyle}>{title}</h3>
      {description && <p style={descriptionStyle}>{description}</p>}
      {action && onAction && (
        <Button onClick={onAction} size="base">
          {action}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
