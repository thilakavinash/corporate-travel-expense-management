import React from 'react';
import { Clock, CheckCircle, XCircle, Ban, DollarSign } from 'lucide-react';

const StatusBadge = ({ status, size = 'base', showIcon = true }) => {
  const statusConfig = {
    pending: {
      backgroundColor: 'var(--color-warning-50)',
      color: 'var(--color-warning-700)',
      borderColor: 'var(--color-warning-200)',
      icon: Clock,
    },
    approved: {
      backgroundColor: 'var(--color-success-50)',
      color: 'var(--color-success-700)',
      borderColor: 'var(--color-success-200)',
      icon: CheckCircle,
    },
    rejected: {
      backgroundColor: 'var(--color-danger-50)',
      color: 'var(--color-danger-700)',
      borderColor: 'var(--color-danger-200)',
      icon: XCircle,
    },
    cancelled: {
      backgroundColor: 'var(--color-gray-100)',
      color: 'var(--color-gray-700)',
      borderColor: 'var(--color-gray-300)',
      icon: Ban,
    },
    paid: {
      backgroundColor: 'var(--color-info-50)',
      color: 'var(--color-info-700)',
      borderColor: 'var(--color-info-200)',
      icon: DollarSign,
    },
  };

  const sizeStyles = {
    sm: {
      padding: '2px 8px',
      fontSize: '11px',
      gap: '4px',
      iconSize: 12,
    },
    base: {
      padding: '4px 12px',
      fontSize: '12px',
      gap: '6px',
      iconSize: 14,
    },
    lg: {
      padding: '6px 16px',
      fontSize: '14px',
      gap: '8px',
      iconSize: 16,
    },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  const sizeConfig = sizeStyles[size];
  const Icon = config.icon;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    padding: sizeConfig.padding,
    borderRadius: 'var(--radius-full)',
    fontSize: sizeConfig.fontSize,
    fontWeight: '500',
    textTransform: 'capitalize',
    backgroundColor: config.backgroundColor,
    color: config.color,
    border: `1px solid ${config.borderColor}`,
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style}>
      {showIcon && <Icon size={sizeConfig.iconSize} />}
      {status}
    </span>
  );
};

export default StatusBadge;
