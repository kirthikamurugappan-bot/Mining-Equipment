import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  Bell,
  Moon,
  Sun,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    taskOverdueAlerts: true,
    costMismatchAlerts: true,
    tyreCriticalAlerts: true
  });

  const [appPreferences, setAppPreferences] = useState({
    currency: 'INR (₹)',
    dateFormat: 'DD/MM/YYYY',
    autoRefreshInterval: '30s'
  });

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem('minetrack_notifications', JSON.stringify(notifications));
    toast.success('Notification preferences saved.');
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('minetrack_preferences', JSON.stringify(appPreferences));
    toast.success('Application preferences updated.');
  };

  const handleCancelNotifications = () => {
    toast('Changes discarded.', { icon: '↩️' });
  };

  const handleCancelPreferences = () => {
    toast('Changes discarded.', { icon: '↩️' });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
          System & Account Preferences
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Configure operational alerts, display preferences, and workstation environment settings.
        </p>
      </div>

      {/* Workstation Appearance */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>Workstation Display Theme</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Choose between Dark Charcoal or Clean Enterprise Light mode for daytime pit conditions.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              Current Theme: {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              High contrast readability optimized for industrial laptops.
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>Toggle Theme</span>
          </button>
        </div>
      </div>

      {/* Operational Notification Preferences */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
          Operational Notification Triggers
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Specify which background events trigger immediate badge alerts.
        </p>

        <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifications.costMismatchAlerts}
              onChange={(e) => setNotifications({ ...notifications, costMismatchAlerts: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#2563EB' }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Automatic Cost Mismatch Alerts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notify immediately when invoice bill differs from entered estimate.</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifications.taskOverdueAlerts}
              onChange={(e) => setNotifications({ ...notifications, taskOverdueAlerts: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#2563EB' }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Overdue Task & Maintenance Escalations</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flag overdue maintenance operations past target completion date.</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifications.tyreCriticalAlerts}
              onChange={(e) => setNotifications({ ...notifications, tyreCriticalAlerts: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#2563EB' }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Critical Tyre Wear Alerts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trigger critical priority notification when OTR tyre condition degrades to Critical.</div>
            </div>
          </label>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={handleCancelNotifications} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save Notifications
            </button>
          </div>
        </form>
      </div>

      {/* Application Regional & Format Preferences */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
          Regional & Currency Formatting
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          All financial calculations strictly utilize Indian Rupee standards.
        </p>

        <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Base Currency</label>
              <input
                type="text"
                disabled
                value="Indian Rupee (₹ INR)"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Date Format</label>
              <input
                type="text"
                disabled
                value="DD/MM/YYYY (Standard IST)"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={handleCancelPreferences} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save Regional Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
