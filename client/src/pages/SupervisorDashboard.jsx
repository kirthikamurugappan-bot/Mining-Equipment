import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Users,
  Truck,
  Wrench,
  CheckSquare,
  AlertTriangle,
  Scale,
  Activity,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalWorkers: 0,
    availableWorkers: 0,
    onLeaveWorkers: 0,
    activeEquipment: 0,
    maintenanceDue: 0,
    pendingTasks: 0,
    openIssues: 0,
    costMismatches: 0,
    activeAlertsCount: 0
  });

  const [workersList, setWorkersList] = useState([]);
  const [costMismatchesList, setCostMismatchesList] = useState([]);
  const [openIssuesList, setOpenIssuesList] = useState([]);
  const [recentAlertsList, setRecentAlertsList] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Workers & Availability
      const workersRes = await api.get('/users/workers');
      const workers = workersRes.data?.data || [];
      const totalWorkers = workers.length;
      const availableWorkers = workers.filter(w => w.availability === 'Available').length;
      const onLeaveWorkers = workers.filter(w => w.availability === 'On Leave').length;
      setWorkersList(workers);

      // 2. Fetch Equipment (Operational/Active)
      const eqRes = await api.get('/equipment?limit=100');
      const equipment = eqRes.data?.data || [];
      const activeEquipment = equipment.filter(e => e.status === 'Operational').length;

      // 3. Fetch Maintenance (Due/Scheduled & Cost Mismatches)
      const maintRes = await api.get('/maintenance?limit=100');
      const maintenance = maintRes.data?.data || [];
      const maintenanceDue = maintenance.filter(m => ['Scheduled', 'Pending', 'Overdue'].includes(m.status)).length;
      const mismatches = maintenance.filter(m => m.costStatus === 'Cost Mismatch');
      setCostMismatchesList(mismatches);

      // 4. Fetch Pending Tasks
      const tasksRes = await api.get('/tasks?limit=100');
      const tasks = tasksRes.data?.data || [];
      const pendingTasks = tasks.filter(t => ['Assigned', 'Acknowledged', 'Not Seen', 'In Progress', 'Pending', 'Overdue'].includes(t.status)).length;

      // 5. Fetch Open Issues
      const issuesRes = await api.get('/issues?limit=100');
      const issues = issuesRes.data?.data || [];
      const openIssues = issues.filter(i => ['Reported', 'Under Review'].includes(i.status));
      setOpenIssuesList(openIssues);

      // 6. Fetch Active Alerts
      const alertsRes = await api.get('/alerts?status=Active&limit=6');
      const alerts = alertsRes.data?.data || [];
      setRecentAlertsList(alerts);

      setMetrics({
        totalWorkers,
        availableWorkers,
        onLeaveWorkers,
        activeEquipment,
        maintenanceDue,
        pendingTasks,
        openIssues: openIssues.length,
        costMismatches: mismatches.length,
        activeAlertsCount: alerts.length
      });
    } catch (err) {
      console.error('Error fetching supervisor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading supervisor operational dashboard...</p>
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
              Operational Overview
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FDE68A'
            }}>
              Supervisor Level
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Welcome back, {user?.name}. Monitor fleet health, manage workforce tasks, and review automated cost verifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <CheckSquare size={16} />
            <span>Assign New Task</span>
          </button>
          <button
            onClick={() => navigate('/maintenance')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Wrench size={16} />
            <span>Schedule Maintenance</span>
          </button>
        </div>
      </div>

      {/* 8 Clickable Real MongoDB Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px'
      }}>
        {/* Total Workers */}
        <div
          onClick={() => navigate('/attendance')}
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
              <Users size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#DCFCE7', color: '#15803D' }}>
              {metrics.availableWorkers} Active
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.totalWorkers}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Workforce</span>
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
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#DCFCE7', color: '#15803D' }}>
              Fleet Live
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.activeEquipment}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Active Equipment</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Maintenance Due */}
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
              Attention
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.maintenanceDue}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Maintenance Due</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => navigate('/tasks')}
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
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
              In Progress
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.pendingTasks}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Pending Tasks</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Open Fault Issues */}
        <div
          onClick={() => navigate('/issues')}
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
              <AlertTriangle size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
              Triage
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.openIssues}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Open Issues</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Cost Mismatches Card */}
        <div
          onClick={() => navigate('/maintenance')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: 'var(--shadow-sm)',
            borderLeft: metrics.costMismatches > 0 ? '4px solid #DC2626' : '1px solid var(--border-color)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
              Review Req.
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.costMismatches}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Cost Mismatches</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Worker Availability Overview */}
        <div
          onClick={() => navigate('/attendance')}
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
              <Activity size={22} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#CCFBF1', color: '#0F766E' }}>
              {metrics.onLeaveWorkers} on Leave
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {Math.round((metrics.availableWorkers / (metrics.totalWorkers || 1)) * 100)}%
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Worker Availability</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>

        {/* Operational Alerts */}
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
              Broadcast
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {metrics.activeAlertsCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Recent Alerts</span>
            <ArrowRight size={14} color="#94A3B8" />
          </div>
        </div>
      </div>

      {/* Two Column Operational Review Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '24px' }}>
        {/* Cost Mismatch Review Card */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scale size={20} color="#DC2626" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Cost Mismatches Awaiting Review
              </h2>
            </div>
            <button
              onClick={() => navigate('/maintenance')}
              style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All
            </button>
          </div>

          {costMismatchesList.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: '600' }}>No Unresolved Cost Mismatches</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All entered maintenance costs match verified invoice bills perfectly.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {costMismatchesList.slice(0, 4).map((item) => (
                <div
                  key={item._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid #FECACA',
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#991B1B' }}>
                        {item.maintenanceId}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#7F1D1D' }}>
                        • {item.equipment?.name || 'Equipment'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#374151' }}>
                      Entered: <strong>{formatINR(item.totalCost || item.enteredCost || 0)}</strong> vs Bill: <strong>{formatINR(item.billCost || 0)}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600', marginTop: '2px' }}>
                      Variance: {formatINR(item.variance || 0)} ({item.variancePercentage > 0 ? `+${item.variancePercentage}%` : `${item.variancePercentage}%`})
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/maintenance')}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Equipment Fault Issues */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#F59E0B" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Recent Reported Issues
              </h2>
            </div>
            <button
              onClick={() => navigate('/issues')}
              style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Manage Issues
            </button>
          </div>

          {openIssuesList.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: '600' }}>No Open Equipment Faults</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All reported faults have been triaged or scheduled.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {openIssuesList.slice(0, 4).map((issue) => (
                <div
                  key={issue._id}
                  style={{
                    padding: '14px 16px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {issue.equipment?.name || 'Equipment'}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: issue.priority === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                        color: issue.priority === 'Critical' ? '#B91C1C' : '#B45309'
                      }}>
                        {issue.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {issue.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Reported by {issue.reportedBy?.name || 'Worker'} • {formatDate(issue.date || issue.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/issues')}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    Triage Decision
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workforce Availability Matrix Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Workforce Availability & Operations Roster
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Enforced availability check: Workers marked "On Leave" cannot be assigned new tasks.
            </p>
          </div>
          <button
            onClick={() => navigate('/attendance')}
            style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Attendance Logs
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>Worker Name</th>
                <th style={{ padding: '10px 14px' }}>ID / Username</th>
                <th style={{ padding: '10px 14px' }}>Designation / Trade</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Availability</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {workersList.slice(0, 6).map((w) => (
                <tr key={w._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {w.name}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {w.employeeId || w.userId} (@{w.username})
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {w.designation || 'Equipment Operator'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor: w.isActive ? '#DCFCE7' : '#F1F5F9',
                      color: w.isActive ? '#15803D' : '#64748B'
                    }}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor: w.availability === 'Available' ? '#DCFCE7' : w.availability === 'On Leave' ? '#FEF3C7' : '#F1F5F9',
                      color: w.availability === 'Available' ? '#15803D' : w.availability === 'On Leave' ? '#B45309' : '#64748B'
                    }}>
                      {w.availability}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate('/tasks')}
                      disabled={w.availability !== 'Available'}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: w.availability === 'Available' ? 'pointer' : 'not-allowed',
                        backgroundColor: w.availability === 'Available' ? '#2563EB' : '#E2E8F0',
                        color: w.availability === 'Available' ? '#FFFFFF' : '#94A3B8'
                      }}
                    >
                      {w.availability === 'Available' ? 'Assign Task' : 'Unavailable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
