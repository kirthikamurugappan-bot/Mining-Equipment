import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  HardHat,
  Truck,
  Wrench,
  Info,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // all, unread, read, task, issue, other
  const [search, setSearch] = useState('');
  const [pushStatus, setPushStatus] = useState('default'); // default, granted, denied, unsupported

  useEffect(() => {
    // Check browser Notification support
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
    } else {
      setPushStatus(Notification.permission);
    }
    fetchNotifications();
  }, [filterTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = '/notifications?limit=100';
      if (filterTab === 'unread') url += '&isRead=false';
      if (filterTab === 'read') url += '&isRead=true';
      if (filterTab === 'task') url += '&type=task_assigned';
      if (filterTab === 'issue') url += '&type=issue_reported';

      const res = await api.get(url);
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      toast.error('Unable to retrieve notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Marked as read');
      }
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/mark-all-read');
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read.');
      }
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleNavigate = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  // Request Web Push Permission
  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission === 'granted') {
        toast.success('Web Push Notifications enabled!');
        // Show test local notification
        new Notification('MineTrack Push Enabled', {
          body: 'You will receive operational dispatches and task assignment alerts.',
          icon: '/favicon.ico'
        });
      } else if (permission === 'denied') {
        toast('Push notifications were blocked. In-app alerts remain active.', { icon: 'ℹ️' });
      }
    } catch (e) {
      console.error('Push permission error:', e);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
      case 'task_due_soon':
      case 'task_overdue':
        return <CheckCircle2 size={20} color="#2563EB" />;
      case 'issue_reported':
      case 'cost_mismatch':
        return <AlertTriangle size={20} color="#DC2626" />;
      case 'maintenance_due':
        return <Wrench size={20} color="#D97706" />;
      case 'attendance_alert':
        return <Clock size={20} color="#059669" />;
      default:
        return <Bell size={20} color="#475569" />;
    }
  };

  const filteredList = notifications.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q) ||
      n.type?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Notification Center & Work Dispatches
            </h1>
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Real-time operational alerts, task assignments, issue dispatches, and supervisor notifications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.85rem' }}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', fontSize: '0.85rem' }}
            title="Refresh"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Push Notification Banner */}
      <div style={{
        backgroundColor: pushStatus === 'granted' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(37, 99, 235, 0.06)',
        border: `1px solid ${pushStatus === 'granted' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: pushStatus === 'granted' ? '#DCFCE7' : '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: pushStatus === 'granted' ? '#15803D' : '#2563EB'
          }}>
            <Smartphone size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {pushStatus === 'granted'
                ? 'Web Push Notifications Active'
                : pushStatus === 'denied'
                ? 'Browser Push Blocked (In-App Notifications Active)'
                : 'Enable Device & Browser Push Notifications'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {pushStatus === 'granted'
                ? 'Your device will receive instant task assignments and operational alert prompts.'
                : pushStatus === 'denied'
                ? 'Notifications were denied in browser permissions. You will still receive in-app notifications in this dashboard.'
                : 'Receive background notifications for high-priority task assignments even when MineTrack is minimized.'}
            </div>
          </div>
        </div>

        {pushStatus === 'default' && (
          <button
            onClick={handleEnablePush}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '8px 16px' }}
          >
            Enable Push Notifications
          </button>
        )}
      </div>

      {/* Filter Tabs and Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Notifications' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'read', label: 'Read' },
            { id: 'task', label: 'Tasks' },
            { id: 'issue', label: 'Issues & Faults' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: '1px solid',
                borderColor: filterTab === tab.id ? '#2563EB' : 'var(--border-color)',
                backgroundColor: filterTab === tab.id ? '#2563EB' : 'var(--bg-primary)',
                color: filterTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading notification records...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Bell size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              No notifications found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {filterTab === 'unread' ? "You're all caught up! No unread notifications." : 'No notifications match the active filter.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredList.map((notif) => {
              const isUnread = !notif.isRead;
              return (
                <div
                  key={notif._id}
                  onClick={() => handleNavigate(notif)}
                  style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isUnread ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isUnread ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isUnread ? 'rgba(37, 99, 235, 0.04)' : 'transparent'}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
                    {/* Notification Type Icon */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '0.95rem',
                          fontWeight: isUnread ? '700' : '600',
                          color: 'var(--text-primary)'
                        }}>
                          {notif.title}
                        </span>

                        {isUnread && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#2563EB'
                          }} />
                        )}

                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          backgroundColor: notif.priority === 'Critical' ? '#FEE2E2' : notif.priority === 'High' ? '#FEF3C7' : '#EFF6FF',
                          color: notif.priority === 'Critical' ? '#B91C1C' : notif.priority === 'High' ? '#B45309' : '#1D4ED8'
                        }}>
                          {notif.priority}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        margin: '0 0 8px 0',
                        lineHeight: 1.4
                      }}>
                        {notif.message}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>{new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {notif.actionUrl && (
                          <span style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <span>View Record</span>
                            <ExternalLink size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '6px',
                          color: '#2563EB',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif._id, e)}
                      title="Delete"
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#94A3B8',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#DC2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
