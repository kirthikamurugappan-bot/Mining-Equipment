import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Play,
  Check,
  MessageSquare,
  AlertTriangle,
  Clock,
  User,
  Truck,
  Calendar,
  X,
  UserCheck,
  RotateCcw,
  Eye,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isWorker = user?.role === 'worker';
  const isAdminOrSupervisor = ['admin', 'supervisor'].includes(user?.role);

  const [tasks, setTasks] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [remarksText, setRemarksText] = useState('');

  // Task Creation Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    equipment: '',
    assignedWorker: '',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  // Worker Leave Warning Modal state
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [unavailableWorkerName, setUnavailableWorkerName] = useState('');

  // Reassign / Reschedule Form
  const [reassignWorker, setReassignWorker] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  useEffect(() => {
    fetchTasks();
    if (isAdminOrSupervisor) {
      fetchEquipment();
      fetchWorkers();
    }
  }, [statusFilter, priorityFilter, search]);

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment?limit=100');
      if (res.data?.success) setEquipmentList(res.data.data || []);
    } catch {
      // Ignore
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/users/workers');
      if (res.data?.success) setWorkersList(res.data.data || []);
    } catch {
      // Ignore
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `/tasks?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        const list = res.data.data || [];
        setTasks(list);

        // Check for deep-linked taskId or id from notification URL
        const paramTaskId = searchParams.get('taskId') || searchParams.get('id');
        if (paramTaskId) {
          const match = list.find(t => t.taskId === paramTaskId || t._id === paramTaskId);
          if (match) {
            setDetailsTask(match);
            setShowDetailsModal(true);
          } else {
            // Attempt to fetch task directly if not in current filter/page
            try {
              const singleRes = await api.get(`/tasks/${paramTaskId}`);
              if (singleRes.data?.success && singleRes.data.data) {
                setDetailsTask(singleRes.data.data);
                setShowDetailsModal(true);
              }
            } catch {
              // Ignore single fetch failure
            }
          }
        }
      }
    } catch {
      toast.error('Unable to retrieve task list.');
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (task) => {
    setDetailsTask(task);
    setShowDetailsModal(true);
  };

  const handleWorkerSelection = (workerId) => {
    const selected = workersList.find(w => w._id === workerId);
    if (selected && selected.availability === 'On Leave') {
      setUnavailableWorkerName(selected.name);
      setShowLeaveWarning(true);
      return;
    }
    setFormData({ ...formData, assignedWorker: workerId });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assignedWorker) {
      toast.error('Please assign an available worker.');
      return;
    }

    try {
      await api.post('/tasks', formData);
      toast.success('Operational task assigned and in-app notification sent to worker.');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        equipment: '',
        assignedWorker: '',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      });
      fetchTasks();
    } catch (err) {
      if (err.response?.data?.workerUnavailable) {
        const workerObj = workersList.find(w => w._id === formData.assignedWorker);
        setUnavailableWorkerName(workerObj?.name || 'Selected worker');
        setShowLeaveWarning(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to assign task.');
      }
    }
  };

  // Worker Workflow Actions
  const handleAcknowledge = async (id) => {
    try {
      const res = await api.put(`/tasks/${id}/acknowledge`);
      toast.success('Task acknowledged. Supervisor notified.');
      if (detailsTask && detailsTask._id === id) {
        setDetailsTask(prev => ({ ...prev, status: 'Acknowledged', acknowledgedAt: new Date().toISOString() }));
      }
      fetchTasks();
    } catch (err) {
      toast.error('Failed to acknowledge task.');
    }
  };

  const handleStart = async (id) => {
    try {
      const res = await api.put(`/tasks/${id}/start`);
      toast.success('Task started. Timer active.');
      if (detailsTask && detailsTask._id === id) {
        setDetailsTask(prev => ({ ...prev, status: 'In Progress', startedAt: new Date().toISOString() }));
      }
      fetchTasks();
    } catch (err) {
      toast.error('Failed to start task.');
    }
  };

  const handleComplete = async (id) => {
    try {
      const res = await api.put(`/tasks/${id}/complete`);
      toast.success('Task marked completed.');
      if (detailsTask && detailsTask._id === id) {
        setDetailsTask(prev => ({ ...prev, status: 'Completed', completedAt: new Date().toISOString() }));
      }
      fetchTasks();
    } catch (err) {
      toast.error('Failed to complete task.');
    }
  };

  const openRemarksModal = (task) => {
    setSelectedTask(task);
    setRemarksText('');
    setShowRemarksModal(true);
  };

  const handleRemarksSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${selectedTask._id}/remarks`, { remarks: remarksText });
      toast.success('Remarks added.');
      if (detailsTask && detailsTask._id === selectedTask._id) {
        setDetailsTask(prev => ({ ...prev, workerRemarks: remarksText }));
      }
      setShowRemarksModal(false);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to add remarks.');
    }
  };

  const openReassignModal = (task) => {
    setSelectedTask(task);
    setReassignWorker(task.assignedWorker?._id || '');
    setRescheduleDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setReassignReason('');
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    try {
      if (reassignWorker && reassignWorker !== selectedTask.assignedWorker?._id) {
        await api.put(`/tasks/${selectedTask._id}/reassign`, {
          workerId: reassignWorker,
          reason: reassignReason
        });
      }
      if (rescheduleDate) {
        await api.put(`/tasks/${selectedTask._id}/reschedule`, {
          newDueDate: rescheduleDate,
          reason: reassignReason
        });
      }
      toast.success('Task reassigned / rescheduled.');
      setShowReassignModal(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'In Progress':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' };
      case 'Acknowledged':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
      case 'Assigned':
      case 'Not Seen':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Overdue':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' };
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
            Operational Task Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Lifecycle workflow: Assigned → Acknowledged → In Progress → Completed. Includes worker availability verification.
          </p>
        </div>

        {isAdminOrSupervisor && (
          <button
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                equipment: equipmentList[0]?._id || '',
                assignedWorker: '',
                priority: 'Medium',
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
              });
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Plus size={18} />
            <span>Create & Assign Task</span>
          </button>
        )}
      </div>

      {/* Filter Controls */}
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
            placeholder="Search task title, ID, equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckSquare size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No tasks assigned.</div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-task-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 18px' }}>Task ID</th>
                    <th style={{ padding: '12px 18px' }}>Title & Scope</th>
                    <th style={{ padding: '12px 18px' }}>Equipment</th>
                    <th style={{ padding: '12px 18px' }}>Assigned Worker</th>
                    <th style={{ padding: '12px 18px' }}>Due Date</th>
                    <th style={{ padding: '12px 18px' }}>Priority</th>
                    <th style={{ padding: '12px 18px' }}>Status</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const badge = getStatusBadge(t.status);
                    const isAssignedToMe = t.assignedWorker?._id?.toString() === user?._id?.toString() || t.assignedWorker === user?._id;

                    return (
                      <tr
                        key={t._id}
                        style={{ borderBottom: '1px solid var(--border-color)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--primary)' }}>
                          <button
                            onClick={() => openDetailsModal(t)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          >
                            {t.taskId}
                          </button>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {t.description?.substring(0, 50)}...
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                          {t.equipment ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Truck size={14} color="#2563EB" />
                              <span>{t.equipment.name || t.equipment.equipmentId}</span>
                            </div>
                          ) : 'General'}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} color="#0F766E" />
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {t.assignedWorker?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                          {formatDate(t.dueDate)}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: t.priority === 'Critical' ? '#FEE2E2' : t.priority === 'High' ? '#FEF3C7' : '#EFF6FF',
                            color: t.priority === 'Critical' ? '#B91C1C' : t.priority === 'High' ? '#B45309' : '#1D4ED8'
                          }}>
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            {/* View Task Details */}
                            <button
                              onClick={() => openDetailsModal(t)}
                              title="View Full Details"
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                              <Eye size={14} />
                            </button>

                            {/* Worker Operational Buttons */}
                            {(isWorker || isAssignedToMe) && (
                              <>
                                {['Assigned', 'Not Seen'].includes(t.status) && (
                                  <button
                                    onClick={() => handleAcknowledge(t._id)}
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                  >
                                    Acknowledge
                                  </button>
                                )}

                                {t.status === 'Acknowledged' && (
                                  <button
                                    onClick={() => handleStart(t._id)}
                                    className="btn btn-primary"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                  >
                                    <Play size={12} />
                                    <span>Start</span>
                                  </button>
                                )}

                                {t.status === 'In Progress' && (
                                  <button
                                    onClick={() => handleComplete(t._id)}
                                    className="btn btn-primary"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: '#16A34A', borderColor: '#16A34A' }}
                                  >
                                    <Check size={12} />
                                    <span>Complete</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* Remarks */}
                            <button
                              onClick={() => openRemarksModal(t)}
                              title="Add Remarks"
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', cursor: 'pointer' }}
                            >
                              <MessageSquare size={14} />
                            </button>

                            {/* Supervisor Reassign / Reschedule */}
                            {isAdminOrSupervisor && t.status !== 'Completed' && (
                              <button
                                onClick={() => openReassignModal(t)}
                                title="Reassign or Reschedule"
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: '#2563EB', cursor: 'pointer' }}
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View (Active on Phone & Tablet Screens) */}
            <div className="mobile-task-cards">
              {tasks.map((t) => {
                const badge = getStatusBadge(t.status);
                const isAssignedToMe = t.assignedWorker?._id?.toString() === user?._id?.toString() || t.assignedWorker === user?._id;

                return (
                  <div
                    key={t._id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.9rem' }}>
                        {t.taskId}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: t.priority === 'Critical' ? '#FEE2E2' : t.priority === 'High' ? '#FEF3C7' : '#EFF6FF',
                          color: t.priority === 'Critical' ? '#B91C1C' : t.priority === 'High' ? '#B45309' : '#1D4ED8'
                        }}>
                          {t.priority}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {t.description}
                      </div>
                    </div>

                    {/* Metadata Items */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', backgroundColor: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Equipment</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{t.equipment?.name || t.equipment?.equipmentId || 'General'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Worker</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{t.assignedWorker?.name || 'Unassigned'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Due Date</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{formatDate(t.dueDate)}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Status</span>
                        <strong style={{ color: badge.text }}>{t.status}</strong>
                      </div>
                    </div>

                    {/* Remarks snippet if present */}
                    {t.workerRemarks && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '6px' }}>
                        <strong>Remarks:</strong> {t.workerRemarks}
                      </div>
                    )}

                    {/* Touch Action Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '6px' }}>
                      <button
                        onClick={() => openDetailsModal(t)}
                        className="btn btn-secondary"
                        style={{ flex: 1, minHeight: '38px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>

                      {(isWorker || isAssignedToMe) && ['Assigned', 'Not Seen'].includes(t.status) && (
                        <button
                          onClick={() => handleAcknowledge(t._id)}
                          className="btn btn-secondary"
                          style={{ flex: 1, minHeight: '38px', fontSize: '0.8rem' }}
                        >
                          Acknowledge
                        </button>
                      )}

                      {(isWorker || isAssignedToMe) && t.status === 'Acknowledged' && (
                        <button
                          onClick={() => handleStart(t._id)}
                          className="btn btn-primary"
                          style={{ flex: 1, minHeight: '38px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Play size={14} />
                          <span>Start</span>
                        </button>
                      )}

                      {(isWorker || isAssignedToMe) && t.status === 'In Progress' && (
                        <button
                          onClick={() => handleComplete(t._id)}
                          className="btn btn-primary"
                          style={{ flex: 1, minHeight: '38px', fontSize: '0.8rem', backgroundColor: '#16A34A', borderColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Check size={14} />
                          <span>Complete</span>
                        </button>
                      )}

                      <button
                        onClick={() => openRemarksModal(t)}
                        className="btn btn-secondary"
                        style={{ minHeight: '38px', padding: '0 12px' }}
                        title="Add Remarks"
                      >
                        <MessageSquare size={14} />
                      </button>

                      {isAdminOrSupervisor && t.status !== 'Completed' && (
                        <button
                          onClick={() => openReassignModal(t)}
                          className="btn btn-secondary"
                          style={{ minHeight: '38px', padding: '0 12px', color: '#2563EB' }}
                          title="Reassign / Reschedule"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Worker Availability Warning Modal (Enforced Requirement) */}
      {showLeaveWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid #FDE68A', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Worker Unavailable
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Worker <strong>{unavailableWorkerName}</strong> is currently on leave and cannot be assigned this task.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLeaveWarning(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveWarning(false)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Choose Another Worker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
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
          <div style={{ width: '100%', maxWidth: '540px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Assign Operations Task</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Inspect hydraulic lines on Dump Truck DT-205"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Equipment</label>
                  <select
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="">General (No machine)</option>
                    {equipmentList.map(eq => (
                      <option key={eq._id} value={eq._id}>{eq.equipmentId} ({eq.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Assign Worker *</label>
                  <select
                    value={formData.assignedWorker}
                    onChange={(e) => handleWorkerSelection(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="">Select Worker</option>
                    {workersList.map(w => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.availability})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Task Instructions & Scope</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Remarks Modal */}
      {showRemarksModal && (
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
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '12px' }}>
              Add Remarks: {selectedTask?.taskId}
            </h3>
            <form onSubmit={handleRemarksSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                rows={3}
                placeholder="Enter field remarks or completion notes..."
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowRemarksModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Remarks</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign / Reschedule Modal */}
      {showReassignModal && (
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
          <div style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '14px' }}>
              Reassign / Reschedule Task: {selectedTask?.taskId}
            </h3>

            <form onSubmit={handleReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Reassign to Worker</label>
                <select
                  value={reassignWorker}
                  onChange={(e) => setReassignWorker(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  {workersList.map(w => (
                    <option key={w._id} value={w._id} disabled={w.availability === 'On Leave'}>
                      {w.name} ({w.availability})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Reschedule Due Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Reason for Change</label>
                <input
                  type="text"
                  placeholder="e.g. Previous operator on medical leave"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowReassignModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal (Deep-link & Click Accessible) */}
      {showDetailsModal && detailsTask && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}>
                  {detailsTask.taskId}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: detailsTask.priority === 'Critical' ? '#FEE2E2' : detailsTask.priority === 'High' ? '#FEF3C7' : '#EFF6FF',
                  color: detailsTask.priority === 'Critical' ? '#B91C1C' : detailsTask.priority === 'High' ? '#B45309' : '#1D4ED8'
                }}>
                  {detailsTask.priority}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  backgroundColor: getStatusBadge(detailsTask.status).bg,
                  color: getStatusBadge(detailsTask.status).text,
                  border: `1px solid ${getStatusBadge(detailsTask.status).border}`
                }}>
                  {detailsTask.status}
                </span>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  {detailsTask.title}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {detailsTask.description || 'No detailed instructions provided.'}
                </p>
              </div>

              {/* Scope & Asset Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'var(--bg-primary)',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                    Assigned Equipment
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={16} color="#2563EB" />
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {detailsTask.equipment?.name || detailsTask.equipment?.equipmentId || 'General Mine Equipment'}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                    Assigned Worker
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="#0F766E" />
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {detailsTask.assignedWorker?.name || 'Unassigned'}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                    Target Due Date
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {formatDate(detailsTask.dueDate)}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                    Current Lifecycle State
                  </span>
                  <strong style={{ color: getStatusBadge(detailsTask.status).text }}>
                    {detailsTask.status}
                  </strong>
                </div>
              </div>

              {/* Remarks History */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} color="var(--primary)" />
                  <span>Field Remarks & Completion Notes</span>
                </div>
                {detailsTask.workerRemarks ? (
                  <div style={{
                    backgroundColor: 'var(--bg-primary)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    borderLeft: '3px solid var(--primary)'
                  }}>
                    {detailsTask.workerRemarks}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No field remarks or operator notes logged yet.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0 0 16px 16px',
              flexWrap: 'wrap'
            }}>
              {/* Worker Actions */}
              {(isWorker || detailsTask.assignedWorker?._id === user?._id || detailsTask.assignedWorker === user?._id) && (
                <>
                  {['Assigned', 'Not Seen'].includes(detailsTask.status) && (
                    <button
                      onClick={() => handleAcknowledge(detailsTask._id)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Acknowledge Task
                    </button>
                  )}

                  {detailsTask.status === 'Acknowledged' && (
                    <button
                      onClick={() => handleStart(detailsTask._id)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Play size={14} />
                      <span>Start Task</span>
                    </button>
                  )}

                  {detailsTask.status === 'In Progress' && (
                    <button
                      onClick={() => handleComplete(detailsTask._id)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#16A34A', borderColor: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Check size={14} />
                      <span>Complete Task</span>
                    </button>
                  )}

                  <button
                    onClick={() => openRemarksModal(detailsTask)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MessageSquare size={14} />
                    <span>Add Remarks</span>
                  </button>
                </>
              )}

              {/* Supervisor Reassign Action */}
              {isAdminOrSupervisor && detailsTask.status !== 'Completed' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openReassignModal(detailsTask);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={14} />
                  <span>Reassign / Reschedule</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
