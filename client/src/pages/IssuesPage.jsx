import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Truck,
  MessageSquare,
  X,
  FileCheck,
  HelpCircle,
  Wrench,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IssuesPage() {
  const { user } = useAuth();
  const isWorker = user?.role === 'worker';
  const isAdminOrSupervisor = ['admin', 'supervisor'].includes(user?.role);

  const [issues, setIssues] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Report Form
  const [formData, setFormData] = useState({
    equipment: '',
    issueType: 'Engine',
    description: '',
    priority: 'Medium',
    date: new Date().toISOString().split('T')[0]
  });

  // Triage Form
  const [triageDecision, setTriageDecision] = useState('Inspection Required');
  const [triageRemarks, setTriageRemarks] = useState('');

  useEffect(() => {
    fetchIssues();
    fetchEquipment();
  }, [statusFilter, priorityFilter, search]);

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment?limit=100');
      if (res.data?.success) setEquipmentList(res.data.data || []);
    } catch {
      // Ignore
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      let url = `/issues?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setIssues(res.data.data || []);
      }
    } catch {
      toast.error('Unable to load issues.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipment) {
      toast.error('Please select the affected machine.');
      return;
    }
    try {
      await api.post('/issues', formData);
      toast.success('Equipment fault reported. Operational supervisor alerted.');
      setShowReportModal(false);
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    }
  };

  const openTriageModal = (issue) => {
    setSelectedIssue(issue);
    setTriageDecision('Inspection Required');
    setTriageRemarks(issue.supervisorRemarks || '');
    setShowTriageModal(true);
  };

  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/issues/${selectedIssue._id}/review`, {
        supervisorDecision: triageDecision,
        supervisorRemarks: triageRemarks
      });
      toast.success(`Issue review submitted: ${triageDecision}`);
      setShowTriageModal(false);
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to triage issue.');
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Critical':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'High':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Medium':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' };
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Reported':
      case 'Under Review':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Inspection Required':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' };
      case 'Maintenance Required':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'No Action Required':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'Clarification Requested':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
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
            Equipment Fault & Issue Reporting
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Operators report faults directly from the pit. Supervisors triage into inspections or maintenance.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              equipment: equipmentList[0]?._id || '',
              issueType: 'Engine',
              description: '',
              priority: 'Medium',
              date: new Date().toISOString().split('T')[0]
            });
            setShowReportModal(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#DC2626', borderColor: '#DC2626' }}
        >
          <AlertTriangle size={18} />
          <span>Report Fault Issue</span>
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
            placeholder="Search issue ID, equipment, symptom description..."
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
            <option value="">All Triage States</option>
            <option value="Reported">Reported</option>
            <option value="Inspection Required">Inspection Required</option>
            <option value="Maintenance Required">Maintenance Required</option>
            <option value="No Action Required">No Action Required</option>
            <option value="Clarification Requested">Clarification Requested</option>
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

      {/* Issues Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading issue reports...
          </div>
        ) : issues.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No reported issues found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Issue ID</th>
                  <th style={{ padding: '12px 18px' }}>Machine & Subsystem</th>
                  <th style={{ padding: '12px 18px' }}>Description</th>
                  <th style={{ padding: '12px 18px' }}>Reported By</th>
                  <th style={{ padding: '12px 18px' }}>Report Date</th>
                  <th style={{ padding: '12px 18px' }}>Priority</th>
                  <th style={{ padding: '12px 18px' }}>Triage Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const prioBadge = getPriorityBadge(issue.priority);
                  const statBadge = getStatusBadge(issue.status);

                  return (
                    <tr
                      key={issue._id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#DC2626' }}>
                        {issue.issueId}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {issue.equipment?.name || 'Equipment'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {issue.issueType}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', maxWidth: '280px' }}>
                        <div style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {issue.description}
                        </div>
                        {issue.supervisorRemarks && (
                          <div style={{ fontSize: '0.72rem', color: '#0F766E', fontStyle: 'italic', marginTop: '2px' }}>
                            Supervisor: "{issue.supervisorRemarks}"
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {issue.reportedBy?.name || 'Operator'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {formatDate(issue.date || issue.createdAt)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: prioBadge.bg,
                          color: prioBadge.text,
                          border: `1px solid ${prioBadge.border}`
                        }}>
                          {issue.priority}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor: statBadge.bg,
                          color: statBadge.text,
                          border: `1px solid ${statBadge.border}`
                        }}>
                          {issue.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {isAdminOrSupervisor ? (
                          <button
                            onClick={() => openTriageModal(issue)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #FCA5A5',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Triage Decision
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Under Review</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Fault Issue Modal */}
      {showReportModal && (
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
          <div style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#DC2626' }}>
                Report Equipment Fault / Anomaly
              </h2>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Target Machine *</label>
                <select
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="">Select Equipment</option>
                  {equipmentList.map(eq => (
                    <option key={eq._id} value={eq._id}>{eq.equipmentId} - {eq.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Subsystem / Type</label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="Engine">Engine / Powertrain</option>
                    <option value="Hydraulic">Hydraulic Leaks / Pressure</option>
                    <option value="Transmission">Transmission</option>
                    <option value="Electrical">Electrical / Battery</option>
                    <option value="Brakes">Braking System</option>
                    <option value="Tyre">Tyre Damage / Pressure</option>
                    <option value="Structural">Structural Crack / Body</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="Low">Low (Safe to operate)</option>
                    <option value="Medium">Medium (Attention required)</option>
                    <option value="High">High (Immediate check needed)</option>
                    <option value="Critical">Critical (Immediate shutdown)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Symptom Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe abnormal noise, smoke, fluid leak, vibration, warning lights..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowReportModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#DC2626', borderColor: '#DC2626' }}>Submit Fault Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supervisor Triage Modal */}
      {showTriageModal && (
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>
              Supervisor Triage: {selectedIssue?.issueId}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Machine: <strong>{selectedIssue?.equipment?.name}</strong> • Reported by {selectedIssue?.reportedBy?.name}
            </p>

            <form onSubmit={handleTriageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Operational Decision *</label>
                <select
                  value={triageDecision}
                  onChange={(e) => setTriageDecision(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="Inspection Required">Inspection Required (Send Inspector)</option>
                  <option value="Maintenance Required">Maintenance Required (Schedule Workshop)</option>
                  <option value="No Action Required">No Action Required (Normal Observation)</option>
                  <option value="Request More Information">Request More Information (Clarification)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Supervisor Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Instructions for operator or maintenance shop..."
                  value={triageRemarks}
                  onChange={(e) => setTriageRemarks(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowTriageModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Apply Triage</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
