import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import {
  Truck,
  CheckSquare,
  AlertTriangle,
  Bell,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Loader2,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [equipment, setEquipment] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarksModal, setRemarksModal] = useState({ open: false, taskId: null, remarks: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, eqRes, alertsRes, attRes] = await Promise.all([
        api.get('/tasks?limit=10'),
        api.get(`/equipment?assignedWorker=${user?._id}`),
        api.get('/alerts?limit=5'),
        api.get('/attendance/today')
      ]);

      if (tasksRes.data?.success) setTasks(tasksRes.data.data || []);
      if (eqRes.data?.success && eqRes.data.data?.length > 0) {
        setEquipment(eqRes.data.data[0]);
      }
      if (alertsRes.data?.success) setAlerts(alertsRes.data.data || []);
      if (attRes.data?.success) setAttendance(attRes.data.data);
    } catch (err) {
      console.error('Error fetching worker dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?._id]);

  // Attendance actions
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/checkin');
      if (res.data?.success) {
        setAttendance(res.data.data);
        toast.success(res.data.message || 'Punched in successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/checkout');
      if (res.data?.success) {
        setAttendance(res.data.data);
        toast.success(res.data.message || 'Punched out successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Task actions
  const handleTaskAction = async (taskId, action) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/tasks/${taskId}/${action}`);
      if (res.data?.success) {
        toast.success(`Task ${action}ed successfully!`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} task`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!remarksModal.remarks.trim()) return;
    setActionLoading(true);
    try {
      await api.put(`/tasks/${remarksModal.taskId}/remarks`, { remarks: remarksModal.remarks });
      toast.success('Remarks saved.');
      setRemarksModal({ open: false, taskId: null, remarks: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save remarks');
    } finally {
      setActionLoading(false);
    }
  };

  const todayTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} className="spin" color="#2563EB" />
        <span style={{ marginLeft: '12px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading Worker Dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD', marginBottom: '4px' }}>
            Equipment Operator Workspace
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 6px 0' }}>
            Welcome back, {user?.name}!
          </h1>
          <p style={{ margin: 0, color: '#DBEAFE', fontSize: '0.95rem' }}>
            {user?.designation || 'Operator'} • Department: {user?.department || 'Mining Operations'}
          </p>
        </div>

        {/* Quick Attendance Control in Banner */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#BFDBFE' }}>Today's Shift Status</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: attendance?.checkIn ? (attendance?.checkOut ? '#94A3B8' : '#4ADE80') : '#FBBF24'
              }} />
              {attendance?.checkIn ? (attendance?.checkOut ? 'Shift Completed' : 'Clocked In') : 'Not Checked In'}
            </div>
          </div>

          <div>
            {!attendance?.checkIn ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCheckIn}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Check In
              </button>
            ) : !attendance?.checkOut ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCheckOut}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Check Out
              </button>
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>Worked {attendance.hoursWorked}h</span>
            )}
          </div>
        </div>
      </div>

      {/* 4 Clickable Metric Cards as required by prompt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {/* Card 1: Assigned Equipment */}
        <div
          onClick={() => navigate('/equipment')}
          className="clickable-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Assigned Equipment</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {equipment ? equipment.equipmentId : 'None'}
          </div>
          <div style={{ fontSize: '0.8rem', color: equipment ? '#16A34A' : 'var(--text-muted)' }}>
            {equipment ? `${equipment.name} • ${equipment.status}` : 'No equipment directly assigned'}
          </div>
        </div>

        {/* Card 2: Today's Tasks */}
        <div
          onClick={() => navigate('/tasks')}
          className="clickable-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Today's Tasks</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {todayTasks.length} Pending
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {completedTasks.length} tasks completed
          </div>
        </div>

        {/* Card 3: Pending Inspections */}
        <div
          onClick={() => navigate('/tasks')}
          className="clickable-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Pending Inspections</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {tasks.filter(t => t.title.toLowerCase().includes('inspect') && t.status !== 'Completed').length} Due
          </div>
          <div style={{ fontSize: '0.8rem', color: '#D97706' }}>
            Pre-op and safety checks
          </div>
        </div>

        {/* Card 4: Active Alerts */}
        <div
          onClick={() => navigate('/alerts')}
          className="clickable-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Active Alerts</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {alerts.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#DC2626' }}>
            Requires attention
          </div>
        </div>
      </div>

      {/* Main Grid: My Tasks & Assigned Equipment */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px' }}>
        {/* Left Column: Tasks Section */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                My Assigned Tasks
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Acknowledge, start, add remarks, and complete your operational jobs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/issues')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <AlertTriangle size={16} />
              <span>Report Fault</span>
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={42} color="#16A34A" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>No pending tasks today</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>All assigned jobs are acknowledged and completed!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {todayTasks.map(task => (
                <div
                  key={task._id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
                          {task.taskId}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: task.status === 'In Progress' ? '#DBEAFE' : task.status === 'Acknowledged' ? '#FEF3C7' : '#F1F5F9',
                          color: task.status === 'In Progress' ? '#1E40AF' : task.status === 'Acknowledged' ? '#92400E' : '#475569'
                        }}>
                          {task.status}
                        </span>
                        {task.priority === 'Critical' && (
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '9999px' }}>
                            Critical
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                        {task.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {task.description}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Date</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatDate(task.dueDate)}
                      </div>
                    </div>
                  </div>

                  {/* Remarks preview if present */}
                  {task.workerRemarks && (
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>My Remarks:</strong> {task.workerRemarks}
                    </div>
                  )}

                  {/* Worker Action Buttons: Acknowledge, Start, Complete, Remarks */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                    {task.status === 'Assigned' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleTaskAction(task._id, 'acknowledge')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #2563EB',
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Acknowledge
                      </button>
                    )}

                    {['Assigned', 'Acknowledged'].includes(task.status) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleTaskAction(task._id, 'start')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #16A34A',
                          backgroundColor: '#16A34A',
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Play size={14} />
                        <span>Start Task</span>
                      </button>
                    )}

                    {task.status === 'In Progress' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleTaskAction(task._id, 'complete')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #059669',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setRemarksModal({ open: true, taskId: task._id, remarks: task.workerRemarks || '' })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>{task.workerRemarks ? 'Edit Remarks' : 'Add Remarks'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Equipment Profile & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Equipment Card */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                My Equipment
              </h3>
              <Truck size={20} color="#2563EB" />
            </div>

            {equipment ? (
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                  {equipment.equipmentId}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155', marginBottom: '12px' }}>
                  {equipment.name}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{equipment.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Model:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{equipment.model || 'Standard'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{equipment.location || equipment.site}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span style={{
                      backgroundColor: equipment.status === 'Operational' ? '#DCFCE7' : '#FEE2E2',
                      color: equipment.status === 'Operational' ? '#166534' : '#991B1B',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {equipment.status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/issues')}
                  style={{
                    width: '100%',
                    marginTop: '18px',
                    padding: '10px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>Report Issue on {equipment.equipmentId}</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No equipment currently assigned to your shift.</p>
              </div>
            )}
          </div>

          {/* Quick Alerts Feed */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Recent Alerts
              </h3>
              <button
                type="button"
                onClick={() => navigate('/alerts')}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
              >
                View All
              </button>
            </div>

            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active alerts
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alerts.map(a => (
                  <div
                    key={a._id}
                    onClick={() => navigate('/alerts')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      borderLeft: `4px solid ${a.priority === 'Critical' ? '#DC2626' : '#2563EB'}`,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{a.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.3 }}>{a.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Remarks Modal */}
      {remarksModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 80,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
              Worker Task Remarks
            </h3>
            <textarea
              rows={4}
              value={remarksModal.remarks}
              onChange={(e) => setRemarksModal({ ...remarksModal, remarks: e.target.value })}
              placeholder="Enter observations, test results, or spare parts used..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setRemarksModal({ open: false, taskId: null, remarks: '' })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveRemarks}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
