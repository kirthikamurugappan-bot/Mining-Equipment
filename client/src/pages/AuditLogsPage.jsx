import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDateTime } from '../utils/formatters';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  RotateCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionSearch, setActionSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionSearch]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/audit?limit=60`;
      if (moduleFilter) url += `&module=${moduleFilter}`;
      if (actionSearch) url += `&action=${encodeURIComponent(actionSearch)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setLogs(res.data.data || []);
      }
    } catch {
      toast.error('Unable to retrieve audit logs.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Enterprise System Audit & Compliance Trail
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Immutable chronological record of administrative actions, user creations, cost variance overrides, and equipment edits.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RotateCw size={16} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search action, description, record ID..."
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">All Modules</option>
          <option value="equipment">Equipment</option>
          <option value="tyre">Tyres</option>
          <option value="maintenance">Maintenance</option>
          <option value="task">Tasks</option>
          <option value="issue">Issues</option>
          <option value="users">Users</option>
          <option value="auth">Authentication</option>
          <option value="bill">Bills</option>
        </select>
      </div>

      {/* Logs Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading audit events...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No audit logs found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Timestamp</th>
                  <th style={{ padding: '12px 18px' }}>User & Role</th>
                  <th style={{ padding: '12px 18px' }}>Module</th>
                  <th style={{ padding: '12px 18px' }}>Action</th>
                  <th style={{ padding: '12px 18px' }}>Description</th>
                  <th style={{ padding: '12px 18px' }}>Record ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {log.user?.name || 'System'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {log.userRole || log.user?.role || 'Service'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#F3E8FF',
                        color: '#7E22CE',
                        border: '1px solid #D8B4FE'
                      }}>
                        {log.module}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
                      {log.description}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.recordId || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
