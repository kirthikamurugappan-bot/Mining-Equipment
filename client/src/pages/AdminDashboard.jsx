import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import {
  Users,
  ShieldCheck,
  Truck,
  Disc,
  Wrench,
  Bell,
  Activity,
  ArrowRight,
  UserPlus,
  Settings,
  ShieldAlert,
  Server,
  Database,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalEquipment: 0,
    totalTyres: 0,
    totalMaintenance: 0,
    activeAlerts: 0
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await api.get('/users?limit=100');
      const users = usersRes.data?.data || [];
      const totalUsers = usersRes.data?.total || users.length;
      const activeUsers = users.filter(u => u.isActive).length;
      setRecentUsers(users.slice(0, 5));

      // 2. Fetch Equipment
      const eqRes = await api.get('/equipment?limit=100');
      const totalEquipment = eqRes.data?.total || eqRes.data?.count || 0;

      // 3. Fetch Tyres
      const tyresRes = await api.get('/tyres?limit=100');
      const totalTyres = tyresRes.data?.total || tyresRes.data?.count || 0;

      // 4. Fetch Maintenance
      const maintRes = await api.get('/maintenance?limit=100');
      const totalMaintenance = maintRes.data?.total || maintRes.data?.count || 0;

      // 5. Fetch Active Alerts
      const alertsRes = await api.get('/alerts?status=Active');
      const activeAlerts = alertsRes.data?.total || alertsRes.data?.data?.length || 0;

      // 6. Fetch System Activity (Audit Logs)
      const auditRes = await api.get('/audit?limit=6');
      setAuditLogs(auditRes.data?.data || []);

      setMetrics({
        totalUsers,
        activeUsers,
        totalEquipment,
        totalTyres,
        totalMaintenance,
        activeAlerts
      });
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading enterprise administrative console...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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
              System Administration
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#F3E8FF',
              color: '#7E22CE',
              border: '1px solid #D8B4FE'
            }}>
              Master Admin
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Welcome, {user?.name}. Manage corporate user accounts, access control, system integrity, and full audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/users')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
          >
            <UserPlus size={16} />
            <span>Create Employee User</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Settings size={16} />
            <span>System Settings</span>
          </button>
        </div>
      </div>

      {/* 6 Clickable Metrics from MongoDB */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '18px'
      }}>
        {/* Total Users */}
        <div
          onClick={() => navigate('/users')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#DCFCE7', color: '#15803D' }}>
              {metrics.activeUsers} Active
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.totalUsers}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total System Users</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Active Equipment */}
        <div
          onClick={() => navigate('/equipment')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
              Fleet
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.totalEquipment}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Equipment</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Total Tyres */}
        <div
          onClick={() => navigate('/tyres')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Disc size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#CCFBF1', color: '#0F766E' }}>
              Inventory
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.totalTyres}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Tyre Assets</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Maintenance Records */}
        <div
          onClick={() => navigate('/maintenance')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FEF3C7', color: '#B45309' }}>
              Operations
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.totalMaintenance}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Maintenance Jobs</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Active Alerts */}
        <div
          onClick={() => navigate('/alerts')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
              System
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.activeAlerts}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Active Alerts</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Security & Access */}
        <div
          onClick={() => navigate('/audit-logs')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#DCFCE7', color: '#15803D' }}>
              100% Secure
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            RBAC
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Audit & Compliance</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>
      </div>

      {/* Two Column Administrative Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '24px' }}>
        {/* System Activity / Audit Logs */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={20} color="#7C3AED" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Real-Time Audit Trail
              </h2>
            </div>
            <button
              onClick={() => navigate('/audit-logs')}
              style={{ fontSize: '0.8rem', color: '#7C3AED', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Full Log Stream
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No audit records found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {auditLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {log.action}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#F3E8FF',
                        color: '#7E22CE'
                      }}>
                        {log.module}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {log.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.user?.name || 'System User'} • {formatDateTime(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee Accounts Quick Roster */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="#2563EB" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Recent Employee Accounts
              </h2>
            </div>
            <button
              onClick={() => navigate('/users')}
              style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Manage Users
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentUsers.map((u) => (
              <div
                key={u._id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {u.name} <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>({u.employeeId || u.userId})</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    @{u.username} • {u.department || 'Operations'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: u.role === 'admin' ? '#F3E8FF' : u.role === 'supervisor' ? '#FEF3C7' : '#DBEAFE',
                    color: u.role === 'admin' ? '#7E22CE' : u.role === 'supervisor' ? '#B45309' : '#1D4ED8'
                  }}>
                    {u.role}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: u.isActive ? '#DCFCE7' : '#FEE2E2',
                    color: u.isActive ? '#15803D' : '#B91C1C'
                  }}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
