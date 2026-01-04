import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Check, Edit3, AlertCircle, X } from 'lucide-react';

const BusinessInfo = () => {
  const navigate = useNavigate();
  const { locationRecord, refreshData } = useLocation();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const [formData, setFormData] = useState({
    store_name: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    if (locationRecord) {
      setFormData({
        store_name: locationRecord.store_name || '',
        phone: locationRecord.phone || '',
        email: locationRecord.email || '',
        website: locationRecord.website || '',
        description: locationRecord.description || '',
      });
    }
  }, [locationRecord]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    if (!locationRecord?.id) return;
    if (!formData.store_name.trim()) {
      setError('Store name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          store_name: formData.store_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          website: formData.website.trim(),
          description: formData.description.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', locationRecord.id);

      if (updateError) throw updateError;

      setSaved(true);
      setPendingApproval(true);
      setIsEditing(false);
      await refreshData();

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (locationRecord) {
      setFormData({
        store_name: locationRecord.store_name || '',
        phone: locationRecord.phone || '',
        email: locationRecord.email || '',
        website: locationRecord.website || '',
        description: locationRecord.description || '',
      });
    }
    setIsEditing(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <button onClick={() => navigate('/info')} style={styles.backBtn}>
          <ChevronLeft size={20} />
          <span>Location Settings</span>
        </button>

        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Business Information</h1>
            <p style={styles.subtitle}>Store name, contact, description</p>
          </div>
          {!isEditing && (
            <button style={styles.editBtn} onClick={() => setShowEditConfirm(true)}>
              <Edit3 size={16} />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Messages */}
        {error && <div style={styles.errorMsg}>{error}</div>}
        {saved && (
          <div style={styles.successMsg}>
            <Check size={16} />
            <span>Saved successfully!</span>
          </div>
        )}
        {pendingApproval && (
          <div style={styles.pendingBanner}>
            <AlertCircle size={18} />
            <span>Changes are waiting to be approved by CardChase</span>
          </div>
        )}

        {/* Form */}
        <div style={styles.section}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Store Name *</label>
            <input
              type="text"
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              value={formData.store_name}
              onChange={handleChange('store_name')}
              placeholder="Epic Card Games"
              disabled={!isEditing}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              value={formData.phone}
              onChange={handleChange('phone')}
              placeholder="(555) 123-4567"
              disabled={!isEditing}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="contact@yourstore.com"
              disabled={!isEditing}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Website</label>
            <input
              type="url"
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              value={formData.website}
              onChange={handleChange('website')}
              placeholder="https://yourstore.com"
              disabled={!isEditing}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={{
                ...styles.input,
                ...styles.textarea,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Tell traders about your store..."
              rows={3}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div style={styles.editActions}>
            <button onClick={resetForm} style={styles.cancelBtn}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                ...styles.saveBtn,
                opacity: loading ? 0.6 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Submit for Approval'}
            </button>
          </div>
        )}
      </div>

      {/* Edit Confirmation Modal */}
      {showEditConfirm && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowEditConfirm(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <AlertCircle size={24} color="#f59e0b" />
              <button style={styles.modalClose} onClick={() => setShowEditConfirm(false)}>
                <X size={20} />
              </button>
            </div>
            <h3 style={styles.modalTitle}>Edit Business Info</h3>
            <p style={styles.modalText}>
              Changes to your business information will need to be approved by CardChase before going live.
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowEditConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={() => {
                  setShowEditConfirm(false);
                  setIsEditing(true);
                  setPendingApproval(false);
                }}
              >
                Continue to Edit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 0',
    marginBottom: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0ea5e9',
    fontSize: '14px',
    cursor: 'pointer',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6a6a6a',
    margin: 0,
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    border: '1px solid rgba(14, 165, 233, 0.3)',
    borderRadius: '8px',
    color: '#0ea5e9',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  errorMsg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '16px',
  },
  successMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#22c55e',
    fontSize: '14px',
    marginBottom: '16px',
  },
  pendingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '10px',
    color: '#f59e0b',
    fontSize: '14px',
    marginBottom: '16px',
  },
  section: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '20px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  inputDisabled: {
    backgroundColor: '#151515',
    color: '#888',
    cursor: 'not-allowed',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
  },
  editActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  cancelBtn: {
    flex: 1,
    padding: '16px',
    backgroundColor: 'transparent',
    border: '1px solid #3a3a3a',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 2,
    padding: '16px',
    backgroundColor: '#0ea5e9',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '360px',
    zIndex: 1001,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#6a6a6a',
    cursor: 'pointer',
    padding: 0,
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  modalText: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.5',
    margin: '0 0 24px 0',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  modalCancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    border: '1px solid #3a3a3a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#0ea5e9',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default BusinessInfo;
