import React from 'react';

const Card = ({
  children,
  className = '',
  style = {},
  variant = 'default',
  padding = 'lg',
  hoverable = false,
  ...props
}) => {
  const paddingStyles = {
    none: '0',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  };

  const variantStyles = {
    default: {
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
    },
    elevated: {
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      backgroundColor: 'var(--color-surface)',
      border: '2px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'none',
    },
    filled: {
      backgroundColor: 'var(--color-gray-50)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'none',
    },
  };

  const cardStyle = {
    ...variantStyles[variant],
    padding: paddingStyles[padding],
    transition: hoverable ? 'all 150ms ease-in-out' : 'none',
    cursor: hoverable ? 'pointer' : 'default',
    ...style,
  };

  const handleMouseEnter = (e) => {
    if (hoverable) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    }
  };

  const handleMouseLeave = (e) => {
    if (hoverable) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow;
    }
  };

  return (
    <div
      style={cardStyle}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
