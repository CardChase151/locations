import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Check, Edit3, AlertCircle, X, MapPin } from 'lucide-react';

const AddressInfo = () => {
  const navigate = useNavigate();
  const { locationRecord, refreshData } = useLocation();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [geocodeStatus, setGeocodeStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  useEffect(() => {
    if (locationRecord) {
      setFormData({
        address: locationRecord.address || '',
        city: locationRecord.city || '',
        state: locationRecord.state || '',
        zip_code: locationRecord.zip_code || '',
      });
    }
  }, [locationRecord]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
    setError('');
  };

  const geocodeAddress = async () => {
    const { address, city, state, zip_code } = formData;
    if (!address || !city || !state) return null;

    const addressString = [address, city, state, zip_code, 'USA'].filter(Boolean).join(', ');

    try {
      setGeocodeStatus('Getting coordinates...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
        { headers: { 'User-Agent': 'CardChase-LocationPortal/1.0' } }
      );

      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        setGeocodeStatus(`Found: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`);
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        setGeocodeStatus('Could not find coordinates');
        return null;
      }
    } catch (err) {
      console.error('Geocode error:', err);
      setGeocodeStatus('Geocoding failed');
      return null;
    }
  };

  const handleSave = async () => {
    if (!locationRecord?.id) return;

    setLoading(true);
    setError('');

    try {
      let coordinates = null;
      if (formData.address && formData.city && formData.state) {
        coordinates = await geocodeAddress();
      }

      const updateData = {
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        updated_at: new Date().toISOString(),
      };

      if (coordinates) {
        updateData.latitude = coordinates.latitude;
        updateData.longitude = coordinates.longitude;
      }

      const { error: updateError } = await supabase
        .from('locations')
        .update(updateData)
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
        address: locationRecord.address || '',
        city: locationRecord.city || '',
        state: locationRecord.state || '',
        zip_code: locationRecord.zip_code || '',
      });
    }
    setIsEditing(false);
    setGeocodeStatus('');
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
            <h1 style={styles.title}>Address</h1>
            <p style={styles.subtitle}>Location and coordinates</p>
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
            <label style={styles.label}>Street Address</label>
            <input
              type="text"
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              value={formData.address}
              onChange={handleChange('address')}
              placeholder="123 Main Street"
              disabled={!isEditing}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 2 }}>
              <label style={styles.label}>City</label>
              <input
                type="text"
                style={{
                  ...styles.input,
                  ...(isEditing ? {} : styles.inputDisabled),
                }}
                value={formData.city}
                onChange={handleChange('city')}
                placeholder="Los Angeles"
                disabled={!isEditing}
              />
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>State</label>
              <input
                type="text"
                style={{
                  ...styles.input,
                  ...(isEditing ? {} : styles.inputDisabled),
                }}
                value={formData.state}
                onChange={handleChange('state')}
                placeholder="CA"
                maxLength={2}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ZIP Code</label>
            <input
              type="text"
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              value={formData.zip_code}
              onChange={handleChange('zip_code')}
              placeholder="90210"
              maxLength={10}
              disabled={!isEditing}
            />
          </div>

          {geocodeStatus && (
            <div style={styles.geocodeStatus}>
              <MapPin size={14} />
              <span>{geocodeStatus}</span>
            </div>
          )}

          {/* Current Coordinates */}
          {locationRecord?.latitude && locationRecord?.longitude && (
            <div style={styles.coordsInfo}>
              <span style={styles.coordsLabel}>Current Coordinates</span>
              <span style={styles.coordsValue}>
                {locationRecord.latitude.toFixed(6)}, {locationRecord.longitude.toFixed(6)}
              </span>
            </div>
          )}
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
            <h3 style={styles.modalTitle}>Edit Address</h3>
            <p style={styles.modalText}>
              Changes to your address will need to be approved by CardChase before going live.
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
  row: {
    display: 'flex',
    gap: '12px',
  },
  geocodeStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#0ea5e9',
    marginTop: '8px',
  },
  coordsInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  coordsLabel: {
    fontSize: '12px',
    color: '#6a6a6a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  coordsValue: {
    fontSize: '14px',
    color: '#ffffff',
    fontFamily: 'monospace',
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

export default AddressInfo;
