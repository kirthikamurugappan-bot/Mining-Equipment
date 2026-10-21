import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  Disc,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  ClipboardCheck,
  RotateCw,
  X,
  AlertTriangle,
  Truck,
  Gauge
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TyresPage() {
  const { user } = useAuth();
  const isAdminOrSupervisor = ['admin', 'supervisor'].includes(user?.role);

  const [tyresList, setTyresList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTyre, setCurrentTyre] = useState(null);

  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectTyre, setInspectTyre] = useState(null);
  const [inspectData, setInspectData] = useState({ condition: 'Good', mileage: 0, notes: '' });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTyre, setHistoryTyre] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    tyreId: '',
    brand: 'Bridgestone',
    size: '40.00R57',
    equipment: '',
    position: 'Front Left',
    mileage: 0,
    condition: 'Good',
    notes: ''
  });

  useEffect(() => {
    fetchTyres();
    fetchEquipment();
  }, [conditionFilter, equipmentFilter, search]);

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment?limit=100');
      if (res.data?.success) setEquipmentList(res.data.data || []);
    } catch {
      // Ignore
    }
  };

  const fetchTyres = async () => {
    setLoading(true);
    try {
      let url = `/tyres?limit=100`;
      if (conditionFilter) url += `&condition=${conditionFilter}`;
      if (equipmentFilter) url += `&equipment=${equipmentFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setTyresList(res.data.data || []);
      }
    } catch {
      toast.error('Unable to load tyre inventory.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      tyreId: `TY-${Math.floor(1000 + Math.random() * 9000)}`,
      brand: 'Bridgestone',
      size: '40.00R57',
      equipment: '',
      position: 'Front Left',
      mileage: 0,
      condition: 'Good',
      notes: ''
    });
    setShowAddEditModal(true);
  };

  const openEditModal = (tyre) => {
    setIsEditing(true);
    setCurrentTyre(tyre);
    setFormData({
      tyreId: tyre.tyreId,
      brand: tyre.brand,
      size: tyre.size,
      equipment: tyre.equipment?._id || tyre.equipment || '',
      position: tyre.position || 'Front Left',
      mileage: tyre.mileage || 0,
      condition: tyre.condition || 'Good',
      notes: tyre.notes || ''
    });
    setShowAddEditModal(true);
  };

  const openInspectModal = (tyre) => {
    setInspectTyre(tyre);
    setInspectData({
      condition: tyre.condition || 'Good',
      mileage: tyre.mileage || 0,
      notes: ''
    });
    setShowInspectModal(true);
  };

  const openHistoryModal = async (tyre) => {
    try {
      const res = await api.get(`/tyres/${tyre._id}`);
      if (res.data?.success) {
        setHistoryTyre(res.data.data);
        setShowHistoryModal(true);
      }
    } catch {
      toast.error('Failed to load inspection history.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.equipment) delete payload.equipment;

      if (isEditing) {
        await api.put(`/tyres/${currentTyre._id}`, payload);
        toast.success('Tyre details updated.');
      } else {
        await api.post('/tyres', payload);
        toast.success('New tyre registered.');
      }
      setShowAddEditModal(false);
      fetchTyres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tyre.');
    }
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tyres/${inspectTyre._id}/inspect`, inspectData);
      toast.success('Tyre inspection recorded successfully.');
      setShowInspectModal(false);
      fetchTyres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Inspection failed.');
    }
  };

  const getConditionBadge = (cond) => {
    switch (cond) {
      case 'Good':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'Warning':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Critical':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'Replacement Required':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
      default:
        return { bg: '#E2E8F0', text: '#475569', border: '#CBD5E1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
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
            Mining OTR Tyre Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Track off-the-road (OTR) high-value tyre assets, positions, tread inspection histories, and safety replacements.
          </p>
        </div>

        {isAdminOrSupervisor && (
          <button
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Plus size={18} />
            <span>Register Tyre</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
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
            placeholder="Search tyre ID, brand, size..."
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
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Conditions</option>
            <option value="Good">Good</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
            <option value="Replacement Required">Replacement Required</option>
          </select>

          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Machines</option>
            {equipmentList.map(eq => (
              <option key={eq._id} value={eq._id}>
                {eq.equipmentId} ({eq.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tyres Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading tyres...
          </div>
        ) : tyresList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Disc size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>No tyre records found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Tyre ID</th>
                  <th style={{ padding: '12px 18px' }}>Brand & Size</th>
                  <th style={{ padding: '12px 18px' }}>Attached Machine</th>
                  <th style={{ padding: '12px 18px' }}>Position</th>
                  <th style={{ padding: '12px 18px' }}>Usage (Hrs/Km)</th>
                  <th style={{ padding: '12px 18px' }}>Condition</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tyresList.map((tyre) => {
                  const condStyle = getConditionBadge(tyre.condition);
                  return (
                    <tr
                      key={tyre._id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#0F766E' }}>
                        {tyre.tyreId}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{tyre.brand}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tyre.size}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {tyre.equipment ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={14} color="#2563EB" />
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {tyre.equipment.name || tyre.equipment.equipmentId}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>In Storage</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {tyre.position || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {tyre.mileage?.toLocaleString() || 0} hrs
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor: condStyle.bg,
                          color: condStyle.text,
                          border: `1px solid ${condStyle.border}`
                        }}>
                          {tyre.condition}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openHistoryModal(tyre)}
                            title="Inspection Log"
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
                            <>
                              <button
                                onClick={() => openInspectModal(tyre)}
                                title="Record Inspection"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #99F6E4',
                                  backgroundColor: '#F0FDFA',
                                  color: '#0F766E',
                                  fontSize: '0.78rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <ClipboardCheck size={14} />
                                <span>Inspect</span>
                              </button>

                              <button
                                onClick={() => openEditModal(tyre)}
                                title="Edit Tyre"
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
                            </>
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

      {/* Add / Edit Modal */}
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
            maxWidth: '560px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                {isEditing ? `Edit Tyre: ${formData.tyreId}` : 'Register New Tyre'}
              </h2>
              <button onClick={() => setShowAddEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Tyre ID *</label>
                  <input
                    type="text"
                    value={formData.tyreId}
                    onChange={(e) => setFormData({ ...formData, tyreId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Brand *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Size Specification</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Usage Mileage (Hours)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Mount on Machine</label>
                  <select
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="">Unmounted / Spares Storage</option>
                    {equipmentList.map(eq => (
                      <option key={eq._id} value={eq._id}>{eq.equipmentId} ({eq.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="Front Left">Front Left (Pos 1)</option>
                    <option value="Front Right">Front Right (Pos 2)</option>
                    <option value="Rear Left Outer">Rear Left Outer (Pos 3)</option>
                    <option value="Rear Left Inner">Rear Left Inner (Pos 4)</option>
                    <option value="Rear Right Inner">Rear Right Inner (Pos 5)</option>
                    <option value="Rear Right Outer">Rear Right Outer (Pos 6)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Condition Status</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="Good">Good (Healthy tread)</option>
                  <option value="Warning">Warning (Minor wear / monitoring)</option>
                  <option value="Critical">Critical (High wear / damage)</option>
                  <option value="Replacement Required">Replacement Required</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddEditModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Save Changes' : 'Register Tyre'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Tyre Modal */}
      {showInspectModal && (
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
              Record Inspection: {inspectTyre?.tyreId}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Record current tread condition, hours logged, and physical observations.
            </p>

            <form onSubmit={handleInspectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Observed Condition *</label>
                <select
                  value={inspectData.condition}
                  onChange={(e) => setInspectData({ ...inspectData, condition: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="Good">Good</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                  <option value="Replacement Required">Replacement Required</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Current Mileage / Operating Hours</label>
                <input
                  type="number"
                  value={inspectData.mileage}
                  onChange={(e) => setInspectData({ ...inspectData, mileage: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Inspector Notes & Tread Depth (mm)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. 42mm tread depth remaining, minor sidewall scuffing..."
                  value={inspectData.notes}
                  onChange={(e) => setInspectData({ ...inspectData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowInspectModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#0F766E', borderColor: '#0F766E' }}>Save Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
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
          <div style={{ width: '100%', maxWidth: '640px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                Inspection History: {historyTyre?.tyreId}
              </h2>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!historyTyre?.inspectionHistory?.length ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>No previous inspection entries.</p>
              ) : (
                historyTyre.inspectionHistory.map((h, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{formatDate(h.date)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                        {h.condition}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Mileage: {h.mileage} hrs • Inspected by {h.inspectedBy?.name || 'Technician'}
                    </div>
                    {h.notes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                        "{h.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
