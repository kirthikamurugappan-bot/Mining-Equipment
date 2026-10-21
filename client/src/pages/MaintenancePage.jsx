import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatINR } from '../utils/formatters';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Clock,
  Check,
  X,
  FileText,
  DollarSign,
  Truck,
  Disc,
  User,
  ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const { user } = useAuth();
  const isAdminOrSupervisor = ['admin', 'supervisor'].includes(user?.role);

  const [maintenanceList, setMaintenanceList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [costStatusFilter, setCostStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewMaint, setReviewMaint] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Schedule Form
  const [scheduleData, setScheduleData] = useState({
    maintenanceId: '',
    equipment: '',
    maintenanceType: 'Preventive',
    priority: 'Medium',
    scheduledDate: new Date().toISOString().split('T')[0],
    assignedWorker: '',
    description: '',
    totalCost: 0,
    billCost: 0
  });

  // Cost Update Form
  const [costData, setCostData] = useState({
    enteredCost: 0,
    billCost: 0,
    remarks: ''
  });

  useEffect(() => {
    fetchMaintenance();
    fetchEquipment();
    fetchWorkers();
  }, [statusFilter, costStatusFilter, search]);

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

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      let url = `/maintenance?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (costStatusFilter) url += `&costStatus=${costStatusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setMaintenanceList(res.data.data || []);
      }
    } catch {
      toast.error('Unable to retrieve maintenance records.');
    } finally {
      setLoading(false);
    }
  };

  const openScheduleModal = () => {
    setScheduleData({
      maintenanceId: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
      equipment: equipmentList[0]?._id || '',
      maintenanceType: 'Preventive',
      priority: 'Medium',
      scheduledDate: new Date().toISOString().split('T')[0],
      assignedWorker: '',
      description: '',
      totalCost: 0,
      billCost: 0
    });
    setShowScheduleModal(true);
  };

  const openCostModal = (m) => {
    setSelectedMaint(m);
    setCostData({
      enteredCost: m.totalCost || m.enteredCost || 0,
      billCost: m.billCost || 0,
      remarks: m.remarks || ''
    });
    setShowCostModal(true);
  };

  const openReviewModal = (m) => {
    setReviewMaint(m);
    setReviewDecision('Approved');
    setReviewRemarks(m.costReviewRemarks || '');
    setShowReviewModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleData.equipment) {
      toast.error('Please select an equipment.');
      return;
    }
    try {
      const payload = { ...scheduleData };
      if (!payload.assignedWorker) delete payload.assignedWorker;
      await api.post('/maintenance', payload);
      toast.success('Maintenance scheduled successfully.');
      setShowScheduleModal(false);
      fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule maintenance.');
    }
  };

  const handleCostSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/maintenance/${selectedMaint._id}/cost`, costData);
      toast.success('Maintenance costs updated. Automated verification refreshed.');
      setShowCostModal(false);
      fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update costs.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/maintenance/${reviewMaint._id}/review-cost`, {
        decision: reviewDecision,
        remarks: reviewRemarks
      });
      toast.success(`Cost mismatch review submitted: ${reviewDecision}`);
      setShowReviewModal(false);
      fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/maintenance/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchMaintenance();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const getCostStatusBadge = (status, variance) => {
    switch (status) {
      case 'Cost Matched':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Cost Matched' };
      case 'Cost Mismatch':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5', label: 'Cost Mismatch' };
      case 'Bill Cost Missing':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Bill Cost Missing' };
      case 'Entered Cost Missing':
        return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', label: 'Entered Cost Missing' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1', label: 'Awaiting Cost Data' };
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
            Maintenance Operations & Cost Verification
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Automated invoice reconciliation (Variance = Bill Cost - Entered Cost). Real-time financial audit in Indian Rupees (₹).
          </p>
        </div>

        {isAdminOrSupervisor && (
          <button
            onClick={openScheduleModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Plus size={18} />
            <span>Schedule Job</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
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
            placeholder="Search maintenance ID, equipment, description..."
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
            <option value="">All Job Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={costStatusFilter}
            onChange={(e) => setCostStatusFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Cost States</option>
            <option value="Cost Matched">Cost Matched (₹0 Variance)</option>
            <option value="Cost Mismatch">Cost Mismatch (Review Req)</option>
            <option value="Bill Cost Missing">Bill Cost Missing</option>
            <option value="Entered Cost Missing">Entered Cost Missing</option>
            <option value="Awaiting Cost Data">Awaiting Cost Data</option>
          </select>
        </div>
      </div>

      {/* Maintenance Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading maintenance operations...
          </div>
        ) : maintenanceList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Wrench size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No maintenance records found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Job ID</th>
                  <th style={{ padding: '12px 18px' }}>Equipment & Type</th>
                  <th style={{ padding: '12px 18px' }}>Assigned Worker</th>
                  <th style={{ padding: '12px 18px' }}>Scheduled Date</th>
                  <th style={{ padding: '12px 18px' }}>Job Status</th>
                  <th style={{ padding: '12px 18px' }}>Entered Cost</th>
                  <th style={{ padding: '12px 18px' }}>Bill Cost</th>
                  <th style={{ padding: '12px 18px' }}>Reconciliation Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceList.map((m) => {
                  const entered = m.totalCost || m.enteredCost || 0;
                  const bill = m.billCost || 0;
                  const costBadge = getCostStatusBadge(m.costStatus, m.variance);

                  return (
                    <tr
                      key={m._id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--primary)' }}>
                        {m.maintenanceId}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {m.equipment?.name || 'Heavy Equipment'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {m.maintenanceType} ({m.priority} Priority)
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {m.assignedWorker ? m.assignedWorker.name : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {formatDate(m.scheduledDate)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {isAdminOrSupervisor ? (
                          <select
                            value={m.status}
                            onChange={(e) => handleStatusChange(m._id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{m.status}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {entered > 0 ? formatINR(entered) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {bill > 0 ? formatINR(bill) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: costBadge.bg,
                            color: costBadge.text,
                            border: `1px solid ${costBadge.border}`,
                            width: 'fit-content'
                          }}>
                            {costBadge.label}
                          </span>

                          {m.costStatus === 'Cost Mismatch' && (
                            <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: '600' }}>
                              Var: {formatINR(m.variance || 0)} ({m.variancePercentage > 0 ? `+${m.variancePercentage}%` : `${m.variancePercentage}%`})
                            </span>
                          )}

                          {m.costVerificationStatus && m.costVerificationStatus !== 'Pending' && (
                            <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: '600' }}>
                              Supervisor: {m.costVerificationStatus}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => openCostModal(m)}
                            title="Update Costs & Bill Invoice"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FileText size={14} />
                            <span>Costs</span>
                          </button>

                          {m.costStatus === 'Cost Mismatch' && isAdminOrSupervisor && (
                            <button
                              onClick={() => openReviewModal(m)}
                              title="Triage Cost Variance"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Scale size={14} />
                              <span>Review</span>
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
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      {showScheduleModal && (
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
          <div style={{ width: '100%', maxWidth: '580px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Schedule Maintenance Operation</h2>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Job ID *</label>
                  <input
                    type="text"
                    value={scheduleData.maintenanceId}
                    onChange={(e) => setScheduleData({ ...scheduleData, maintenanceId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Target Equipment *</label>
                  <select
                    value={scheduleData.equipment}
                    onChange={(e) => setScheduleData({ ...scheduleData, equipment: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="">Select Equipment</option>
                    {equipmentList.map(eq => (
                      <option key={eq._id} value={eq._id}>{eq.equipmentId} - {eq.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Maintenance Type</label>
                  <select
                    value={scheduleData.maintenanceType}
                    onChange={(e) => setScheduleData({ ...scheduleData, maintenanceType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="Preventive">Preventive Service</option>
                    <option value="Corrective">Corrective Repair</option>
                    <option value="Emergency">Emergency Breakdown</option>
                    <option value="Inspection">Routine Inspection</option>
                    <option value="Oil Change">Oil & Lube Service</option>
                    <option value="Brake Service">Brake Overhaul</option>
                    <option value="Tyre Maintenance">Tyre Rotation / Fix</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Priority Level</label>
                  <select
                    value={scheduleData.priority}
                    onChange={(e) => setScheduleData({ ...scheduleData, priority: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Scheduled Date *</label>
                  <input
                    type="date"
                    value={scheduleData.scheduledDate}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Assigned Technician / Worker</label>
                  <select
                    value={scheduleData.assignedWorker}
                    onChange={(e) => setScheduleData({ ...scheduleData, assignedWorker: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="">No Worker Assigned</option>
                    {workersList.map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.availability})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Estimated / Entered Cost (₹)</label>
                  <input
                    type="number"
                    value={scheduleData.totalCost}
                    onChange={(e) => setScheduleData({ ...scheduleData, totalCost: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Vendor Bill Cost (₹)</label>
                  <input
                    type="number"
                    value={scheduleData.billCost}
                    onChange={(e) => setScheduleData({ ...scheduleData, billCost: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Work Description</label>
                <textarea
                  rows={3}
                  placeholder="Details of service scope, parts needed..."
                  value={scheduleData.description}
                  onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Schedule Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cost Entry & Bill Reconciliation Modal */}
      {showCostModal && (
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>
              Cost Data: {selectedMaint?.maintenanceId}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Input technician entered cost and contractor invoice bill. The system automatically reconciles variances.
            </p>

            <form onSubmit={handleCostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  Entered / Estimated Cost (₹)
                </label>
                <input
                  type="number"
                  value={costData.enteredCost}
                  onChange={(e) => setCostData({ ...costData, enteredCost: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  Contractor Bill / Invoice Amount (₹)
                </label>
                <input
                  type="number"
                  value={costData.billCost}
                  onChange={(e) => setCostData({ ...costData, billCost: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              {/* Live Preview of Variance */}
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Calculated Variance:</span>
                  <strong>{formatINR((costData.billCost || 0) - (costData.enteredCost || 0))}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {costData.billCost === costData.enteredCost ? (
                    <span style={{ color: '#16A34A', fontWeight: '600' }}>✓ Exact Match (Auto-Approved)</span>
                  ) : costData.billCost > 0 && costData.enteredCost > 0 ? (
                    <span style={{ color: '#DC2626', fontWeight: '600' }}>⚠ Cost Mismatch detected — Requires Supervisor Review</span>
                  ) : (
                    <span>Awaiting full cost inputs</span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  Remarks / Invoice Reference
                </label>
                <textarea
                  rows={2}
                  value={costData.remarks}
                  onChange={(e) => setCostData({ ...costData, remarks: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCostModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Cost & Reconcile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supervisor Cost Review Modal */}
      {showReviewModal && (
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
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>
              Supervisor Cost Variance Review
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Job: <strong>{reviewMaint?.maintenanceId}</strong> • {reviewMaint?.equipment?.name}
            </p>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span>Entered Cost:</span>
                <strong>{formatINR(reviewMaint?.totalCost || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span>Contractor Bill:</span>
                <strong>{formatINR(reviewMaint?.billCost || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '700', color: '#DC2626', borderTop: '1px solid #FECACA', paddingTop: '6px' }}>
                <span>Variance:</span>
                <span>{formatINR(reviewMaint?.variance || 0)} ({reviewMaint?.variancePercentage}%)</span>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  Supervisor Decision *
                </label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="Approved">Approve Variance (Accept Bill)</option>
                  <option value="Rejected">Reject Variance (Dispute Invoice)</option>
                  <option value="Clarification Requested">Request Clarification from Vendor</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  Decision Remarks / Explanation
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Approved due to additional emergency hydraulic hose replacement..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowReviewModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
