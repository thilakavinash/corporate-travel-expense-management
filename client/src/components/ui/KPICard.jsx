import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  size = 'base',
}) => {
  const colorStyles = {
    primary: {
      background: 'var(--color-primary-50)',
      icon: 'var(--color-primary-600)',
      text: 'var(--color-primary-700)',
    },
    success: {
      background: 'var(--color-success-50)',
      icon: 'var(--color-success-600)',
      text: 'var(--color-success-700)',
    },
    warning: {
      background: 'var(--color-warning-50)',
      icon: 'var(--color-warning-600)',
      text: 'var(--color-warning-700)',
    },
    danger: {
      background: 'var(--color-danger-50)',
      icon: 'var(--color-danger-600)',
      text: 'var(--color-danger-700)',
    },
    info: {
      background: 'var(--color-info-50)',
      icon: 'var(--color-info-600)',
      text: 'var(--color-info-700)',
    },
  };

  const sizeStyles = {
    sm: {
      padding: '16px',
      titleSize: '12px',
      valueSize: '20px',
      iconSize: 32,
    },
    base: {
      padding: '20px',
      titleSize: '13px',
      valueSize: '24px',
      iconSize: 40,
    },
    lg: {
      padding: '24px',
      titleSize: '14px',
      valueSize: '28px',
      iconSize: 48,
    },
  };

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: sizeStyles[size].padding,
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 150ms ease-in-out',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  };

  const titleStyle = {
    fontSize: sizeStyles[size].titleSize,
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const iconWrapperStyle = {
    width: sizeStyles[size].iconSize,
    height: sizeStyles[size].iconSize,
    borderRadius: 'var(--radius-base)',
    backgroundColor: colorStyles[color].background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const valueStyle = {
    fontSize: sizeStyles[size].valueSize,
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '4px',
  };

  const subtitleStyle = {
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
  };

  const trendStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '8px',
  };

  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'var(--color-success-600)';
    if (trend === 'down') return 'var(--color-danger-600)';
    return 'var(--color-text-tertiary)';
  };

  const TrendIcon = getTrendIcon();

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>{title}</span>
        {Icon && (
          <div style={iconWrapperStyle}>
            <Icon size={sizeStyles[size].iconSize * 0.5} style={{ color: colorStyles[color].icon }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={valueStyle}>{value}</span>
        {trend && trendValue && (
          <span style={{ ...trendStyle, color: getTrendColor() }}>
            <TrendIcon size={14} />
            {trendValue}
          </span>
        )}
      </div>
      {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
    </div>
  );
};

export default KPICard;
