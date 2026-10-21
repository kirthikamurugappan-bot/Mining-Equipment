import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
  Filter,
  Calendar,
  Users,
  Search,
  Download,
  ShieldAlert,
  HardHat,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const { user } = useAuth();
  const role = user?.role || 'worker';
  const isWorker = role === 'worker';
  const isSupervisor = role === 'supervisor';
  const isAdmin = role === 'admin';

  // Active view tab for Supervisors and Admins
  // 'my' = Own attendance, 'team' = Worker Monitoring, 'all' = Organization wide
  const [activeTab, setActiveTab] = useState(isWorker ? 'my' : isSupervisor ? 'team' : 'all');

  // Attendance states
  const [todayRecord, setTodayRecord] = useState(null);
  const [activeLeave, setActiveLeave] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTodayStatus();
    if (isAdmin || isSupervisor) {
      fetchAnalytics();
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [activeTab, statusFilter, roleFilter]);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data?.success) {
        setTodayRecord(res.data.data);
        setActiveLeave(res.data.activeLeave);
      }
    } catch {
      // Ignore background errors
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/attendance/analytics');
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch {
      // Ignore
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = '/attendance?limit=100';

      if (activeTab === 'my') {
        url += `&user=${user._id}`;
      } else if (activeTab === 'team') {
        url += '&role=worker';
      } else if (roleFilter) {
        url += `&role=${roleFilter}`;
      }

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const res = await api.get(url);
      if (res.data?.success) {
        setAttendanceList(res.data.data || []);
      }
    } catch {
      toast.error('Unable to retrieve attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/checkin');
      if (res.data?.success) {
        toast.success(res.data.message || 'Check-in recorded successfully.');
        setTodayRecord(res.data.data);
        fetchAttendance();
        if (isAdmin || isSupervisor) fetchAnalytics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/checkout');
      if (res.data?.success) {
        toast.success(res.data.message || 'Check-out recorded successfully.');
        setTodayRecord(res.data.data);
        fetchAttendance();
        if (isAdmin || isSupervisor) fetchAnalytics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Export Attendance to CSV
  const handleExportCSV = () => {
    if (attendanceList.length === 0) {
      return toast.error('No attendance records to export.');
    }

    const headers = ['Date', 'Employee ID', 'Name', 'Role', 'Department', 'Check In', 'Check Out', 'Hours Logged', 'Status', 'Remarks'];
    const rows = attendanceList.map(a => {
      const u = a.user || a.worker || {};
      return [
        formatDate(a.date),
        a.employeeId || u.employeeId || u.userId || '',
        `"${u.name || ''}"`,
        a.userRole || u.role || '',
        `"${a.department || u.department || ''}"`,
        a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '',
        a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '',
        a.hoursWorked || 0,
        a.status || '',
        `"${a.remarks || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MineTrack_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance records exported to CSV.');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'Late':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Leave':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
      case 'Absent':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' };
    }
  };

  const filteredList = attendanceList.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    const u = item.user || item.worker || {};
    return (
      u.name?.toLowerCase().includes(q) ||
      u.userId?.toLowerCase().includes(q) ||
      item.employeeId?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Punch In / Out Actions */}
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
              Workforce Attendance & Shift Registry
            </h1>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE'
            }}>
              {role} portal
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Shift check-in/out, automated working hours tracking, worker presence monitoring, and enterprise attendance records.
          </p>
        </div>

        {/* Punch In / Punch Out Widget for Current User (All 3 roles can punch in/out) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheckIn}
            disabled={!!todayRecord?.checkIn || actionLoading}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: todayRecord?.checkIn ? '#94A3B8' : '#16A34A',
              borderColor: todayRecord?.checkIn ? '#94A3B8' : '#16A34A',
              cursor: todayRecord?.checkIn || actionLoading ? 'not-allowed' : 'pointer',
              color: '#FFFFFF'
            }}
          >
            <LogIn size={16} />
            <span>{todayRecord?.checkIn ? 'Checked In' : 'Punch In'}</span>
          </button>

          <button
            onClick={handleCheckOut}
            disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut || actionLoading}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              color: (!todayRecord?.checkIn || todayRecord?.checkOut) ? '#94A3B8' : '#DC2626',
              cursor: (!todayRecord?.checkIn || todayRecord?.checkOut || actionLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            <LogOut size={16} />
            <span>{todayRecord?.checkOut ? 'Checked Out' : 'Punch Out'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px' }}
              title="Export attendance to CSV"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Attendance Analytics KPI Bar */}
      {isAdmin && analytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Workforce</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{analytics.totalWorkforce}</div>
            <div style={{ fontSize: '0.75rem', color: '#2563EB', marginTop: '2px' }}>Registered personnel</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Present Today</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>{analytics.presentCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '2px' }}>On-shift active</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Late Arrival</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{analytics.lateCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '2px' }}>After 09:30 AM</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Approved Leave</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#7E22CE', marginTop: '4px' }}>{analytics.leaveCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#7E22CE', marginTop: '2px' }}>Authorized leave</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Absent / Pending</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>{analytics.absentCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '2px' }}>Not yet checked in</div>
          </div>
        </div>
      )}

      {/* Today's Personal Shift Status Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Shift Status ({formatDate(new Date())})
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {todayRecord?.status ? (
                <span style={{ color: todayRecord.status === 'Present' ? '#16A34A' : '#D97706' }}>
                  {todayRecord.status}
                </span>
              ) : activeLeave ? (
                <span style={{ color: '#7E22CE' }}>On Approved Leave ({activeLeave.leaveType})</span>
              ) : (
                <span style={{ color: '#94A3B8' }}>Not Yet Checked In</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Punch In Time</div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Punch Out Time</div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Hours Logged</div>
            <div style={{ fontWeight: '700', color: '#2563EB' }}>
              {todayRecord?.hoursWorked ? `${todayRecord.hoursWorked} hrs` : '--'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Leave Status</div>
            <div style={{ fontWeight: '600', color: activeLeave ? '#7E22CE' : '#16A34A' }}>
              {activeLeave ? `On Leave (${activeLeave.leaveType})` : 'Active / Working'}
            </div>
          </div>
        </div>
      </div>

      {/* Role Navigation View Tabs (For Supervisors & Admins) */}
      {!isWorker && (
        <div style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '2px'
        }}>
          {isSupervisor && (
            <button
              onClick={() => setActiveTab('team')}
              style={{
                padding: '10px 18px',
                fontSize: '0.875rem',
                fontWeight: '600',
                border: 'none',
                borderBottom: activeTab === 'team' ? '3px solid #2563EB' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'team' ? '#2563EB' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Worker Attendance Monitoring
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '10px 18px',
                fontSize: '0.875rem',
                fontWeight: '600',
                border: 'none',
                borderBottom: activeTab === 'all' ? '3px solid #2563EB' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'all' ? '#2563EB' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Organization-Wide Attendance
            </button>
          )}

          <button
            onClick={() => setActiveTab('my')}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              borderBottom: activeTab === 'my' ? '3px solid #2563EB' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'my' ? '#2563EB' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            My Shift Attendance Logs
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['', 'Present', 'Late', 'Leave', 'Absent'].map(st => (
            <button
              key={st || 'All'}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: '1px solid',
                borderColor: statusFilter === st ? '#2563EB' : 'var(--border-color)',
                backgroundColor: statusFilter === st ? '#2563EB' : 'var(--bg-primary)',
                color: statusFilter === st ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {st || 'All Statuses'}
            </button>
          ))}
        </div>

        {/* Role Filters (for Admins) & Search */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin && activeTab === 'all' && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Roles</option>
              <option value="worker">Workers Only</option>
              <option value="supervisor">Supervisors Only</option>
              <option value="admin">Admins Only</option>
            </select>
          )}

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name/ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading attendance records...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CalendarCheck size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No attendance records found.</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Check-in today using the button above to create your record.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Date</th>
                  <th style={{ padding: '12px 18px' }}>Employee</th>
                  <th style={{ padding: '12px 18px' }}>Role</th>
                  <th style={{ padding: '12px 18px' }}>Department</th>
                  <th style={{ padding: '12px 18px' }}>Check In</th>
                  <th style={{ padding: '12px 18px' }}>Check Out</th>
                  <th style={{ padding: '12px 18px' }}>Hours Logged</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((att) => {
                  const badge = getStatusBadge(att.status);
                  const u = att.user || att.worker || {};
                  return (
                    <tr
                      key={att._id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {formatDate(att.date)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {u.name || 'Staff Member'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {att.employeeId || u.employeeId || u.userId}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          backgroundColor: '#F1F5F9',
                          color: '#475569'
                        }}>
                          {att.userRole || u.role || 'worker'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {att.department || u.department || 'Operations'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#2563EB' }}>
                        {att.hoursWorked ? `${att.hoursWorked} hrs` : '--'}
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
                          {att.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {att.remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
