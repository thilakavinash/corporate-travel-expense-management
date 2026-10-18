import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Plane, Briefcase, DollarSign } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    backgroundColor: 'var(--color-background)',
  };

  const leftPanelStyle = {
    flex: '1',
    background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
    color: 'var(--color-white)',
    position: 'relative',
    overflow: 'hidden',
  };

  const patternStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    opacity: '0.1',
    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
    backgroundSize: '32px 32px',
  };

  const rightPanelStyle = {
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
    backgroundColor: 'var(--color-surface)',
  };

  const formCardStyle = {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
  };

  const brandStyle = {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const descriptionStyle = {
    fontSize: '16px',
    lineHeight: '1.6',
    opacity: '0.9',
    textAlign: 'center',
    maxWidth: '400px',
  };

  const featuresStyle = {
    display: 'flex',
    gap: '32px',
    marginTop: '48px',
  };

  const featureStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
  };

  const featureIconStyle = {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-base)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const featureTextStyle = {
    fontSize: '13px',
    fontWeight: '500',
  };

  const headerStyle = {
    marginBottom: '32px',
    textAlign: 'center',
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '8px',
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
  };

  const errorStyle = {
    backgroundColor: 'var(--color-danger-50)',
    border: '1px solid var(--color-danger-200)',
    borderRadius: 'var(--radius-base)',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    color: 'var(--color-danger-700)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const togglePasswordStyle = {
    position: 'absolute',
    right: '12px',
    cursor: 'pointer',
    color: 'var(--color-text-tertiary)',
    background: 'none',
    border: 'none',
    padding: '0',
  };

  const footerStyle = {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
  };

  const linkStyle = {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: '500',
  };

  return (
    <div style={containerStyle}>
      {/* Left Panel - Branding */}
      <div style={leftPanelStyle}>
        <div style={patternStyle} />
        <div style={{ position: 'relative', zIndex: '1' }}>
          <div style={brandStyle}>
            <Plane size={40} />
            TravelExpense
          </div>
          <p style={descriptionStyle}>
            Streamline corporate travel management and expense tracking with our enterprise platform.
          </p>
          <div style={featuresStyle}>
            <div style={featureStyle}>
              <div style={featureIconStyle}>
                <Plane size={24} />
              </div>
              <span style={featureTextStyle}>Travel</span>
            </div>
            <div style={featureStyle}>
              <div style={featureIconStyle}>
                <Briefcase size={24} />
              </div>
              <span style={featureTextStyle}>Expenses</span>
            </div>
            <div style={featureStyle}>
              <div style={featureIconStyle}>
                <DollarSign size={24} />
              </div>
              <span style={featureTextStyle}>Reimburse</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={rightPanelStyle}>
        <div style={formCardStyle}>
          <div style={headerStyle}>
            <h1 style={titleStyle}>Welcome back</h1>
            <p style={subtitleStyle}>Sign in to your account</p>
          </div>

          {error && (
            <div style={errorStyle}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              type="email"
              name="email"
              label="Email address"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              icon={Mail}
            />

            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                icon={Lock}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={togglePasswordStyle}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              style={{ width: '100%' }}
            >
              Sign In
            </Button>
          </form>

          <div style={footerStyle}>
            Don't have an account?{' '}
            <Link to="/register" style={linkStyle}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
