import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Sun, Moon, Loader2, AlertCircle, HardHat, ShieldCheck, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Mode: 'login' or 'register'
  const [isRegister, setIsRegister] = useState(false);

  // Login form state
  const [username, setUsername] = useState(() => localStorage.getItem('minetrack_remembered_user') || '');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(() => !!localStorage.getItem('minetrack_remembered_user'));
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('worker');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'worker') navigate('/worker', { replace: true });
      else if (user.role === 'supervisor') navigate('/supervisor', { replace: true });
      else navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      return setError('Username or Email ID is required.');
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
        setError('Cannot reach server. Please check your network connection.');
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = regEmail.trim();
    if (!trimmedEmail) {
      return setError('User mail ID is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return setError('Please enter a valid email address.');
    }
    if (!regPassword || regPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      const res = await register({
        email: trimmedEmail,
        password: regPassword,
        name: regName.trim(),
        role: regRole
      });
      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => {
          const role = res.user?.role;
          if (role === 'worker') navigate('/worker', { replace: true });
          else if (role === 'supervisor') navigate('/supervisor', { replace: true });
          else navigate('/admin', { replace: true });
        }, 1200);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
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

      {/* Centered Login / Register Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        padding: '32px 28px',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px -2px rgba(37, 99, 235, 0.4)',
            marginBottom: '12px'
          }}>
            <HardHat size={28} color="#ffffff" />
          </div>

          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 4px 0',
            color: '#0F172A'
          }}>
            Mine<span style={{ color: '#2563EB' }}>Track</span>
          </h1>

          <p style={{
            fontSize: '0.82rem',
            color: '#64748B',
            margin: 0,
            lineHeight: 1.4
          }}>
            Mining Equipment & Tyre Maintenance Platform
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F1F5F9',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !isRegister ? '#FFFFFF' : 'transparent',
              color: !isRegister ? '#2563EB' : '#64748B',
              fontWeight: !isRegister ? '700' : '500',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isRegister ? '#FFFFFF' : 'transparent',
              color: isRegister ? '#2563EB' : '#64748B',
              fontWeight: isRegister ? '700' : '500',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={15} />
            <span>Register User</span>
          </button>
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
            padding: '11px 13px',
            fontSize: '0.83rem',
            marginBottom: '18px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message Alert */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#16A34A',
            borderRadius: '8px',
            padding: '11px 13px',
            fontSize: '0.83rem',
            marginBottom: '18px',
            lineHeight: 1.4
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit} noValidate>
            {/* Username / Email Field */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="username-input"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '6px'
                }}
              >
                Username / Email / Employee ID
              </label>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin, ravi01, or your email"
                autoComplete="username"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.93rem',
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
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="password-input"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '6px'
                }}
              >
                Password
              </label>
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
                    fontSize: '0.93rem',
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

            {/* Remember Username */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.83rem',
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

              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Secure Access</span>
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

            {/* Switch to Register link */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '0.83rem', color: '#64748B' }}>Don't have an account? </span>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontWeight: '600',
                  fontSize: '0.83rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Register here
              </button>
            </div>
          </form>
        ) : (
          /* ── REGISTER FORM ── */
          <form onSubmit={handleRegisterSubmit} noValidate>
            {/* User Mail ID Field */}
            <div style={{ marginBottom: '14px' }}>
              <label
                htmlFor="reg-email-input"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '5px'
                }}
              >
                User Mail ID <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="reg-email-input"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. user@minetrack.com"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.93rem',
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
            <div style={{ marginBottom: '14px' }}>
              <label
                htmlFor="reg-password-input"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '5px'
                }}
              >
                Password <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password-input"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 44px 10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.93rem',
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
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
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
                  {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Full Name Field (Optional) */}
            <div style={{ marginBottom: '14px' }}>
              <label
                htmlFor="reg-name-input"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '5px'
                }}
              >
                Full Name <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <input
                id="reg-name-input"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. John Doe"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.93rem',
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

            {/* Role Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="reg-role-select"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '5px'
                }}
              >
                Account Role
              </label>
              <select
                id="reg-role-select"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.93rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  cursor: 'pointer'
                }}
              >
                <option value="worker">Worker / Field Operator</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Register Submit Button */}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>CREATE ACCOUNT</span>
              )}
            </button>

            {/* Switch to Login link */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '0.83rem', color: '#64748B' }}>Already have an account? </span>
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontWeight: '600',
                  fontSize: '0.83rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* System Test Accounts Reference */}
        <div style={{
          marginTop: '20px',
          padding: '11px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '0.74rem',
          color: '#64748B',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
          <div style={{ fontWeight: '600', color: '#334155', marginBottom: '2px' }}>
            System Test Accounts (Password: <code style={{ color: '#2563EB' }}>password123</code>)
          </div>
          <div>Admin: <strong>admin</strong> &bull; Supervisor: <strong>sup1</strong> &bull; Worker: <strong>ravi01</strong></div>
        </div>

        {/* Security Footer Note */}
        <div style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#94A3B8',
          fontSize: '0.74rem'
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>Secured with JWT authentication & role-based routing</span>
        </div>
      </div>
    </div>
  );
}
