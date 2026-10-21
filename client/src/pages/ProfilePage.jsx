import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Edit,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || 'Operations'
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', profileData);
      toast.success('Profile details updated successfully.');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password updated successfully.');
      setShowPasswordChange(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: '800'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {user?.name}
              </h1>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                border: '1px solid #93C5FD'
              }}>
                {user?.role}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Employee ID: <strong>{user?.employeeId || user?.userId}</strong> • @{user?.username}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Personal & Department Details
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Edit size={15} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Contact Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Department</label>
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save Profile
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                {user?.email}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                {user?.phone || '+91 98765 43210'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                {user?.department || 'Operations'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Availability Status</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#16A34A', marginTop: '2px' }}>
                {user?.availability || 'Available'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Password Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Password & Account Security
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Ensure your account uses a strong, protected passphrase.
            </p>
          </div>

          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Key size={15} />
            <span>{showPasswordChange ? 'Hide Form' : 'Change Password'}</span>
          </button>
        </div>

        {showPasswordChange && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>New Password</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowPasswordChange(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
