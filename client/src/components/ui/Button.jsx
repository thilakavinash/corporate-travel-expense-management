import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease-in-out',
    fontFamily: 'var(--font-family)',
    whiteSpace: 'nowrap',
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-white)',
      border: '1px solid var(--color-primary)',
    },
    primaryHover: {
      backgroundColor: 'var(--color-primary-hover)',
      borderColor: 'var(--color-primary-hover)',
    },
    secondary: {
      backgroundColor: 'var(--color-white)',
      color: 'var(--color-gray-700)',
      border: '1px solid var(--color-border)',
    },
    secondaryHover: {
      backgroundColor: 'var(--color-gray-50)',
      borderColor: 'var(--color-gray-400)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-primary)',
    },
    outlineHover: {
      backgroundColor: 'var(--color-primary-50)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'var(--color-white)',
      border: '1px solid var(--color-danger)',
    },
    dangerHover: {
      backgroundColor: 'var(--color-danger-600)',
      borderColor: 'var(--color-danger-600)',
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'var(--color-white)',
      border: '1px solid var(--color-success)',
    },
    successHover: {
      backgroundColor: 'var(--color-success-600)',
      borderColor: 'var(--color-success-600)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-gray-700)',
      border: '1px solid transparent',
    },
    ghostHover: {
      backgroundColor: 'var(--color-gray-100)',
    },
  };

  const sizeStyles = {
    sm: {
      padding: '6px 12px',
      fontSize: '12px',
      gap: '6px',
    },
    base: {
      padding: '10px 20px',
      fontSize: '14px',
      gap: '8px',
    },
    lg: {
      padding: '14px 28px',
      fontSize: '16px',
      gap: '10px',
    },
  };

  const disabledStyles = {
    opacity: '0.5',
    cursor: 'not-allowed',
  };

  const handleMouseEnter = (e) => {
    if (!disabled && !loading && variantStyles[variant + 'Hover']) {
      Object.assign(e.target.style, variantStyles[variant + 'Hover']);
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled && !loading) {
      Object.assign(e.target.style, variantStyles[variant]);
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(disabled || loading ? disabledStyles : {}),
  };

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      style={combinedStyles}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </button>
  );
};

export default Button;
