import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Sun, Moon, Loader2, AlertCircle, HardHat, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState(() => localStorage.getItem('minetrack_remembered_user') || '');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(() => !!localStorage.getItem('minetrack_remembered_user'));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'worker') navigate('/worker', { replace: true });
      else if (user.role === 'supervisor') navigate('/supervisor', { replace: true });
      else navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      return setError('Username or Employee ID is required.');
    }
    if (!password) {
      return setError('Password is required.');
    }

    setLoading(true);
    try {
      const res = await login(trimmedUser, password);
      if (res.success) {
        if (rememberUser) {
          localStorage.setItem('minetrack_remembered_user', trimmedUser);
        } else {
          localStorage.removeItem('minetrack_remembered_user');
        }

        const role = res.user?.role;
        if (role === 'worker') navigate('/worker', { replace: true });
        else if (role === 'supervisor') navigate('/supervisor', { replace: true });
        else navigate('/admin', { replace: true });
      } else {
        setError(res.message || 'Invalid username or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (!err.response) {
        setError('Cannot reach server on port 5000. Please start your backend server using "npm.cmd run server".');
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#0b1329' : '#0f172a',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
      fontFamily: 'var(--font-main)',
      position: 'relative',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        type="button"
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 50,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '8px 14px',
          cursor: 'pointer',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>

      {/* Centered Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        padding: '36px 32px',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Brand Header inside Card */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px -2px rgba(37, 99, 235, 0.4)',
            marginBottom: '14px'
          }}>
            <HardHat size={30} color="#ffffff" />
          </div>

          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
            color: '#0F172A'
          }}>
            Mine<span style={{ color: '#2563EB' }}>Track</span>
          </h1>

          <p style={{
            fontSize: '0.85rem',
            color: '#64748B',
            margin: 0,
            lineHeight: 1.4
          }}>
            Mining Equipment & Tyre Maintenance Platform
          </p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username Field */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="username-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              Username / Employee ID
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, sup1, or ravi01"
              autoComplete="username"
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563EB'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="password-input"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  padding: '11px 44px 11px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Username Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#475569'
            }}>
              <input
                type="checkbox"
                checked={rememberUser}
                onChange={(e) => setRememberUser(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  accentColor: '#2563EB',
                  cursor: 'pointer'
                }}
              />
              <span>Remember Username</span>
            </label>

            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Internal Access</span>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#1D4ED8')}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#2563EB')}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>LOGIN</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Reference Note */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#64748B',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
          <div style={{ fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
            System Test Accounts (Password: <code style={{ color: '#2563EB' }}>password123</code>)
          </div>
          <div>Admin: <strong>admin</strong> &bull; Supervisor: <strong>sup1</strong> &bull; Worker: <strong>ravi01</strong></div>
        </div>

        {/* Security Footer Note */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#94A3B8',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>Secured with JWT authentication & role-based routing</span>
        </div>
      </div>
    </div>
  );
}
