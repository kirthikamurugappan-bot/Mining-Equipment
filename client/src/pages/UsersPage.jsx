import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Key,
  X,
  Shield,
  Briefcase,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // User Form
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    employeeId: '',
    email: '',
    password: '',
    role: 'worker',
    phone: '',
    department: 'Mining Operations',
    designation: 'Dump Truck Operator',
    availability: 'Available',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, availabilityFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/users?limit=100`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (availabilityFilter) url += `&availability=${availabilityFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch {
      toast.error('Unable to retrieve user list.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      username: '',
      employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      email: '',
      password: 'password123',
      role: 'worker',
      phone: '+91 98765 43210',
      department: 'Mining Operations',
      designation: 'Equipment Operator',
      availability: 'Available',
      isActive: true
    });
    setShowAddEditModal(true);
  };

  const openEditModal = (u) => {
    setIsEditing(true);
    setSelectedUser(u);
    setFormData({
      name: u.name,
      username: u.username || '',
      employeeId: u.employeeId || '',
      email: u.email,
      password: '', // do not display passwords
      role: u.role,
      phone: u.phone || '',
      department: u.department || 'Mining Operations',
      designation: u.designation || '',
      availability: u.availability || 'Available',
      isActive: u.isActive !== undefined ? u.isActive : true
    });
    setShowAddEditModal(true);
  };

  const openResetPasswordModal = (u) => {
    setSelectedUser(u);
    setNewPassword('password123');
    setShowResetPasswordModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const payload = { ...formData };
        delete payload.password; // password reset is separate
        await api.put(`/users/${selectedUser._id}`, payload);
        toast.success('User updated successfully.');
      } else {
        await api.post('/users', formData);
        toast.success(`Employee account created for ${formData.name}`);
      }
      setShowAddEditModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser._id}/reset-password`, { newPassword });
      toast.success(`Password reset for ${selectedUser.name}`);
      setShowResetPasswordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed.');
    }
  };

  const handleToggleActive = async (u) => {
    const action = u.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${u.name}'s account?`)) return;

    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`User ${action}d successfully.`);
      fetchUsers();
    } catch {
      toast.error(`Failed to ${action} user.`);
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
            Employee Accounts & Access Control
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Admin exclusive console: Onboard staff, configure RBAC roles (Worker, Supervisor, Admin), and monitor availability.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
        >
          <UserPlus size={18} />
          <span>Add Employee User</span>
        </button>
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
            placeholder="Search employee name, username, ID, email..."
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Roles</option>
            <option value="worker">Worker</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Availabilities</option>
            <option value="Available">Available</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading employee directory...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No users found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Employee ID</th>
                  <th style={{ padding: '12px 18px' }}>Name & Username</th>
                  <th style={{ padding: '12px 18px' }}>Email & Phone</th>
                  <th style={{ padding: '12px 18px' }}>Role</th>
                  <th style={{ padding: '12px 18px' }}>Department</th>
                  <th style={{ padding: '12px 18px' }}>Availability</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--primary)' }}>
                      {u.employeeId || u.userId}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{u.username}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      <div>{u.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone || 'No phone'}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        backgroundColor: u.role === 'admin' ? '#F3E8FF' : u.role === 'supervisor' ? '#FEF3C7' : '#DBEAFE',
                        color: u.role === 'admin' ? '#7E22CE' : u.role === 'supervisor' ? '#B45309' : '#1D4ED8'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {u.department || 'Operations'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        backgroundColor: u.availability === 'Available' ? '#DCFCE7' : u.availability === 'On Leave' ? '#FEF3C7' : '#F1F5F9',
                        color: u.availability === 'Available' ? '#15803D' : u.availability === 'On Leave' ? '#B45309' : '#64748B'
                      }}>
                        {u.availability}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        backgroundColor: u.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: u.isActive ? '#15803D' : '#B91C1C'
                      }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: '#2563EB', cursor: 'pointer' }}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => openResetPasswordModal(u)}
                          title="Reset Password"
                          style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: '#D97706', cursor: 'pointer' }}
                        >
                          <Key size={14} />
                        </button>

                        <button
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? 'Deactivate User' : 'Activate User'}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: u.isActive ? '#FCA5A5' : '#86EFAC',
                            backgroundColor: u.isActive ? '#FEF2F2' : '#DCFCE7',
                            color: u.isActive ? '#DC2626' : '#15803D',
                            cursor: 'pointer'
                          }}
                        >
                          {u.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal (Role Selection is ONLY HERE) */}
      {showAddEditModal && (
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                {isEditing ? `Edit User: ${selectedUser?.name}` : 'Create Employee Account'}
              </h2>
              <button onClick={() => setShowAddEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. rajesh01"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Employee ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP1005"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh@minetrack.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Initial Temporary Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              )}

              {/* ROLE SELECTION — ONLY FOR ADMIN ACCOUNT CREATION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Corporate Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="worker">Worker (Operator / Technician)</option>
                    <option value="supervisor">Supervisor (Operations Management)</option>
                    <option value="admin">Admin (System Administrator)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Designation / Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Dump Truck Operator"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Initial Availability</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="Available">Available</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddEditModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Save Changes' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetPasswordModal && (
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px' }}>
              Reset Password: {selectedUser?.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Enter a new secure password for this user.
            </p>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowResetPasswordModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
