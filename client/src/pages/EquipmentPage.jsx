import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatINR } from '../utils/formatters';
import {
  Truck,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Disc,
  Clock,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EquipmentPage() {
  const { user } = useAuth();
  const isAdminOrSupervisor = ['admin', 'supervisor'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEquipment, setDetailEquipment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    equipmentId: '',
    name: '',
    type: 'Dump Truck',
    model: '',
    manufacturer: '',
    year: new Date().getFullYear(),
    location: '',
    site: 'Pit Alpha',
    assignedWorker: '',
    status: 'Operational',
    notes: ''
  });

  useEffect(() => {
    fetchEquipment();
    if (isAdminOrSupervisor) {
      fetchWorkers();
    }
  }, [statusFilter, search]);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/users/workers');
      if (res.data?.success) {
        setWorkers(res.data.data || []);
      }
    } catch {
      // Ignore
    }
  };

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      let url = `/equipment?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setEquipmentList(res.data.data || []);
      }
    } catch (err) {
      toast.error('Unable to load equipment list.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      equipmentId: `EQ-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      type: 'Dump Truck',
      model: '',
      manufacturer: 'Caterpillar',
      year: new Date().getFullYear(),
      location: 'Pit Alpha - Zone 1',
      site: 'Pit Alpha',
      assignedWorker: '',
      status: 'Operational',
      notes: ''
    });
    setShowAddEditModal(true);
  };

  const openEditModal = (eq) => {
    setIsEditing(true);
    setCurrentEquipment(eq);
    setFormData({
      equipmentId: eq.equipmentId,
      name: eq.name,
      type: eq.type,
      model: eq.model || '',
      manufacturer: eq.manufacturer || '',
      year: eq.year || new Date().getFullYear(),
      location: eq.location || '',
      site: eq.site || 'Pit Alpha',
      assignedWorker: eq.assignedWorker?._id || eq.assignedWorker || '',
      status: eq.status,
      notes: eq.notes || ''
    });
    setShowAddEditModal(true);
  };

  const openDetailModal = async (eq) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/equipment/${eq._id}`);
      if (res.data?.success) {
        setDetailEquipment(res.data.data);
      }
    } catch {
      toast.error('Failed to load equipment details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Equipment Name is required.');
      return;
    }

    try {
      const payload = { ...formData };
      if (!payload.assignedWorker) delete payload.assignedWorker;

      if (isEditing) {
        await api.put(`/equipment/${currentEquipment._id}`, payload);
        toast.success('Equipment updated successfully.');
      } else {
        await api.post('/equipment', payload);
        toast.success('Equipment added successfully.');
      }
      setShowAddEditModal(false);
      fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save equipment.');
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success('Equipment deactivated.');
      fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deactivation failed.');
    }
  };

  // Filter & Sort
  const filteredEquipment = equipmentList
    .filter(eq => !typeFilter || eq.type === typeFilter)
    .sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Operational':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'Under Maintenance':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Inactive':
        return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' };
      default:
        return { bg: '#E2E8F0', text: '#475569', border: '#CBD5E1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
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
            Mining Equipment Fleet
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Comprehensive tracking of heavy mining machinery, assigned operators, maintenance states, and attached tyres.
          </p>
        </div>

        {isAdminOrSupervisor && (
          <button
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Plus size={18} />
            <span>Add Equipment</span>
          </button>
        )}
      </div>

      {/* Search, Filter & Sort Controls */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search equipment ID, name, model, serial..."
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

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Types</option>
            <option value="Dump Truck">Dump Truck</option>
            <option value="Excavator">Excavator</option>
            <option value="Wheel Loader">Wheel Loader</option>
            <option value="Bulldozer">Bulldozer</option>
            <option value="Drilling Machine">Drilling Machine</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="equipmentId-asc">ID (A-Z)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="status-asc">Status</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            Loading equipment records...
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Truck size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>No equipment records found.</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try adjusting your search criteria or add new equipment.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Equipment ID</th>
                  <th style={{ padding: '12px 18px' }}>Name & Model</th>
                  <th style={{ padding: '12px 18px' }}>Type</th>
                  <th style={{ padding: '12px 18px' }}>Location</th>
                  <th style={{ padding: '12px 18px' }}>Assigned Operator</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((eq) => {
                  const badge = getStatusBadge(eq.status);
                  return (
                    <tr
                      key={eq._id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--primary)' }}>
                        {eq.equipmentId}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{eq.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {eq.manufacturer} {eq.model} ({eq.year || 'N/A'})
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {eq.type}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="#94A3B8" />
                          <span>{eq.location || eq.site || 'Pit Alpha'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {eq.assignedWorker ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} color="#2563EB" />
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {eq.assignedWorker.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                        )}
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
                          {eq.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openDetailModal(eq)}
                            title="View Full History & Tyres"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {isAdminOrSupervisor && (
                            <button
                              onClick={() => openEditModal(eq)}
                              title="Edit Equipment"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: '#2563EB',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit size={15} />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDeactivate(eq._id, eq.name)}
                              title="Deactivate Equipment"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid #FECACA',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={15} />
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

      {/* Add / Edit Equipment Modal */}
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
          <div style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {isEditing ? `Edit Equipment: ${formData.equipmentId}` : 'Add New Equipment'}
              </h2>
              <button
                onClick={() => setShowAddEditModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Equipment ID *
                  </label>
                  <input
                    type="text"
                    value={formData.equipmentId}
                    onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAT 777D Dump Truck"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Equipment Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="Dump Truck">Dump Truck</option>
                    <option value="Excavator">Excavator</option>
                    <option value="Wheel Loader">Wheel Loader</option>
                    <option value="Bulldozer">Bulldozer</option>
                    <option value="Drilling Machine">Drilling Machine</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Caterpillar, Komatsu"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 777D, PC2000"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Manufacturing Year
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Operational Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pit Alpha - Zone 2"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Assigned Worker
                  </label>
                  <select
                    value={formData.assignedWorker}
                    onChange={(e) => setFormData({ ...formData, assignedWorker: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">No Worker Assigned</option>
                    {workers.map(w => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.employeeId || w.userId}) - {w.availability}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Operational Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="Operational">Operational (Ready and Operating)</option>
                  <option value="Under Maintenance">Under Maintenance (Temporarily Offline)</option>
                  <option value="Inactive">Inactive (Decommissioned or Parked)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Notes / Operating Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter remarks, payload capacities, or specific requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isEditing ? 'Save Changes' : 'Create Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / History Modal */}
      {showDetailModal && (
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
          <div style={{
            width: '100%',
            maxWidth: '720px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Equipment Details: {detailEquipment?.equipmentId}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {detailEquipment?.name}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {detailLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading equipment history...
                </div>
              ) : (
                <>
                  {/* Summary Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {detailEquipment?.status}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Operator</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {detailEquipment?.assignedWorker?.name || 'Unassigned'}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {detailEquipment?.location || 'Pit Alpha'}
                      </div>
                    </div>
                  </div>

                  {/* Attached Tyres Section */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Disc size={16} color="#0F766E" />
                      Attached Tyres ({detailEquipment?.tyres?.length || 0})
                    </h3>
                    {!detailEquipment?.tyres?.length ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tyres recorded for this machine.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {detailEquipment.tyres.map(t => (
                          <div key={t.tyreId} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.tyreId}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.brand} • {t.position}</div>
                            <div style={{ fontSize: '0.72rem', color: t.condition === 'Good' ? '#16A34A' : '#DC2626', fontWeight: '600', marginTop: '2px' }}>
                              Condition: {t.condition}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Maintenance History */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wrench size={16} color="#2563EB" />
                      Maintenance Logs ({detailEquipment?.maintenanceHistory?.length || 0})
                    </h3>
                    {!detailEquipment?.maintenanceHistory?.length ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No maintenance records found.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {detailEquipment.maintenanceHistory.map(m => (
                          <div key={m.maintenanceId} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{m.maintenanceId} - {m.maintenanceType}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scheduled: {formatDate(m.scheduledDate)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{formatINR(m.totalCost || 0)}</div>
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                                {m.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
