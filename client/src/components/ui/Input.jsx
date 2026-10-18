import React from 'react';

const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  helperText,
  required = false,
  icon: Icon,
  ...props
}) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const requiredStyle = {
    color: 'var(--color-danger-500)',
  };

  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle = {
    width: '100%',
    padding: Icon ? '10px 12px 10px 40px' : '10px 12px',
    fontSize: '14px',
    fontFamily: 'var(--font-family)',
    color: 'var(--color-text)',
    backgroundColor: 'var(--color-surface)',
    border: `1px solid ${error ? 'var(--color-danger-500)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-base)',
    transition: 'border-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
    outline: 'none',
  };

  const iconStyle = {
    position: 'absolute',
    left: '12px',
    color: 'var(--color-text-tertiary)',
    pointerEvents: 'none',
  };

  const errorStyle = {
    fontSize: '12px',
    color: 'var(--color-danger-500)',
    marginTop: '4px',
  };

  const helperTextStyle = {
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
    marginTop: '4px',
  };

  const handleFocus = (e) => {
    if (!error) {
      e.target.style.borderColor = 'var(--color-primary)';
      e.target.style.boxShadow = '0 0 0 3px var(--color-primary-100)';
    }
  };

  const handleBlur = (e) => {
    if (!error) {
      e.target.style.borderColor = 'var(--color-border)';
      e.target.style.boxShadow = 'none';
    }
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={requiredStyle}>*</span>}
        </label>
      )}
      <div style={inputWrapperStyle}>
        {Icon && <Icon size={18} style={iconStyle} />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>
      {error && <span style={errorStyle}>{error}</span>}
      {helperText && !error && <span style={helperTextStyle}>{helperText}</span>}
    </div>
  );
};

export default Input;
