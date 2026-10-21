import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import {
  LayoutDashboard,
  Truck,
  Disc,
  Wrench,
  CheckSquare,
  AlertTriangle,
  Bell,
  CalendarCheck,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  HardHat,
  Menu,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Fetch unread notification count periodically
  useEffect(() => {
    let isMounted = true;
    const fetchNotificationCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (isMounted && res.data?.success) {
          setUnreadCount(res.data.count || 0);
        }
      } catch (e) {
        // Suppress background poll errors
      }
    };
    fetchNotificationCount();
    const timer = setInterval(fetchNotificationCount, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleOpenNotifications = async () => {
    const nextState = !showNotificationsDropdown;
    setShowNotificationsDropdown(nextState);
    if (nextState) {
      try {
        const res = await api.get('/notifications?limit=6');
        if (res.data?.success) {
          setRecentNotifications(res.data.data || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch {
        // Ignore
      }
    }
  };

  const handleMarkSingleNotificationRead = async (id, actionUrl) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setRecentNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
    setShowNotificationsDropdown(false);
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  const handleMarkAllNotificationsRead = async (e) => {
    e.stopPropagation();
    try {
      await api.put('/notifications/mark-all-read');
      setRecentNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Role-based Navigation configuration
  const role = user?.role || 'worker';

  // Navigation Items
  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: role === 'worker' ? '/worker' : role === 'supervisor' ? '/supervisor' : '/admin',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Equipment',
      icon: Truck,
      path: '/equipment',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Tyres',
      icon: Disc,
      path: '/tyres',
      roles: ['supervisor', 'admin']
    },
    {
      label: 'Maintenance & Cost',
      icon: Wrench,
      path: '/maintenance',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Tasks',
      icon: CheckSquare,
      path: '/tasks',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Fault Reporting',
      icon: AlertTriangle,
      path: '/issues',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Attendance',
      icon: CalendarCheck,
      path: '/attendance',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/notifications',
      badge: unreadCount > 0 ? unreadCount : null,
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Alerts',
      icon: AlertTriangle,
      path: '/alerts',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Reports & Analytics',
      icon: BarChart3,
      path: '/reports',
      roles: ['supervisor', 'admin']
    },
    {
      label: 'Employee Accounts',
      icon: Users,
      path: '/users',
      roles: ['admin']
    },
    {
      label: 'Audit History',
      icon: ShieldAlert,
      path: '/audit-logs',
      roles: ['admin']
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['worker', 'supervisor', 'admin']
    },
    {
      label: 'Profile',
      icon: User,
      path: '/profile',
      roles: ['worker', 'supervisor', 'admin']
    }
  ];

  const visibleNav = navItems.filter(item => item.roles.includes(role));

  const roleBadgeColors = {
    admin: { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' },
    supervisor: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
    worker: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' }
  };

  const badgeStyle = roleBadgeColors[role] || roleBadgeColors.worker;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', fontFamily: 'var(--font-main)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'block'
          }}
        />
      )}

      {/* Sidebar: Dark Charcoal Enterprise Tone */}
      <aside style={{
        width: '260px',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        transition: 'transform 0.25s ease',
        transform: sidebarOpen ? 'translateX(0)' : 'none',
        borderRight: '1px solid #1E293B',
        boxShadow: '4px 0 12px rgba(0,0,0,0.15)'
      }} className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '20px 20px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.4)'
            }}>
              <HardHat size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>
                Mine<span style={{ color: '#38BDF8' }}>Track</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Maintenance Platform
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="mobile-close-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'none'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current User Role Pill */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Authorized User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                @{user?.username || user?.userId}
              </div>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.text,
              border: `1px solid ${badgeStyle.border}`
            }}>
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Items list */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {visibleNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? '#2563EB' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      minWidth: '18px',
                      textAlign: 'center'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom Sidebar: Logout Trigger */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1E293B' }}>
          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              width: '100%',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#F87171',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="main-content-wrapper">
        {/* Top Header */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Left: Mobile Menu Toggle & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn"
              style={{
                display: 'none',
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>MineTrack</span>
              <ChevronRight size={14} />
              <span style={{ textTransform: 'capitalize' }}>
                {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell with Badge & Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={handleOpenNotifications}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-surface)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotificationsDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '360px',
                  maxWidth: '90vw',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)',
                  zIndex: 60,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        style={{ fontSize: '0.75rem', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {recentNotifications.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        No recent notifications
                      </div>
                    ) : (
                      recentNotifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkSingleNotificationRead(n._id, n.actionUrl)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            backgroundColor: !n.isRead ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = !n.isRead ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !n.isRead ? 'rgba(37, 99, 235, 0.05)' : 'transparent'}
                        >
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: !n.isRead ? '#2563EB' : 'transparent',
                            marginTop: '5px',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: !n.isRead ? '700' : '600', color: 'var(--text-primary)', marginBottom: '3px' }}>
                              {n.title}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.35, marginBottom: '4px' }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Click to open
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{
                    padding: '10px 16px',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <button
                      onClick={() => {
                        setShowNotificationsDropdown(false);
                        navigate('/notifications');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      View Notification History &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill */}
            <div
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 6px',
                borderRadius: '30px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700'
              }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body View */}
        <main style={{ flex: 1, padding: '28px', maxWidth: '1440px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            padding: '28px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <LogOut size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Confirm Sign Out
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to logout of MineTrack? You will need your credentials to log in again.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
