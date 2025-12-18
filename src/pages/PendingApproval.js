import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, Edit2, Store, X } from 'lucide-react';
import logo from '../assets/logo.png';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { locationProfile, updateApplication, refreshProfile } = useLocation();
  const { signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
    businessWebsite: '',
    businessDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Populate form with existing data
  useEffect(() => {
    if (locationProfile) {
      setFormData({
        businessName: locationProfile.location_business_name || '',
        businessPhone: locationProfile.location_business_phone || '',
        businessAddress: locationProfile.location_business_address || '',
        businessCity: locationProfile.location_business_city || '',
        businessState: locationProfile.location_business_state || '',
        businessZip: locationProfile.location_business_zip || '',
        businessWebsite: locationProfile.location_business_website || '',
        businessDescription: locationProfile.location_business_description || '',
      });
    }
  }, [locationProfile]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const { error: updateError } = await updateApplication({
      businessName: formData.businessName.trim(),
      businessPhone: formData.businessPhone.trim(),
      businessAddress: formData.businessAddress.trim(),
      businessCity: formData.businessCity.trim(),
      businessState: formData.businessState.trim(),
      businessZip: formData.businessZip.trim(),
      businessWebsite: formData.businessWebsite.trim(),
      businessDescription: formData.businessDescription.trim(),
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message || 'Failed to update. Please try again.');
    } else {
      setSuccess('Application updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (locationProfile) {
      setFormData({
        businessName: locationProfile.location_business_name || '',
        businessPhone: locationProfile.location_business_phone || '',
        businessAddress: locationProfile.location_business_address || '',
        businessCity: locationProfile.location_business_city || '',
        businessState: locationProfile.location_business_state || '',
        businessZip: locationProfile.location_business_zip || '',
        businessWebsite: locationProfile.location_business_website || '',
        businessDescription: locationProfile.location_business_description || '',
      });
    }
    setIsEditing(false);
    setError('');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <img src={logo} alt="CardChase" style={styles.logo} />
          <h1 style={styles.title}>Application Submitted</h1>
        </div>

        {/* Status Card */}
        <div style={styles.statusCard}>
          <div style={styles.statusIcon}>
            <Clock size={32} color="#f59e0b" />
          </div>
          <div style={styles.statusText}>
            <span style={styles.statusLabel}>Status</span>
            <span style={styles.statusValue}>Pending Review</span>
          </div>
        </div>

        {/* Timestamps */}
        <div style={styles.timestamps}>
          <div style={styles.timestamp}>
            <span style={styles.timestampLabel}>Submitted</span>
            <span style={styles.timestampValue}>
              {formatDate(locationProfile?.location_request_submitted_at)}
            </span>
          </div>
          {locationProfile?.location_request_updated_at &&
           locationProfile?.location_request_updated_at !== locationProfile?.location_request_submitted_at && (
            <div style={styles.timestamp}>
              <span style={styles.timestampLabel}>Last Updated</span>
              <span style={styles.timestampValue}>
                {formatDate(locationProfile?.location_request_updated_at)}
              </span>
            </div>
          )}
        </div>

        {/* Info message */}
        <div style={styles.infoMessage}>
          <CheckCircle size={16} />
          <span>We review applications in the order received. You'll receive an email once your store is approved.</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {/* Business Info */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your Application</h2>
            {!isEditing && (
              <button style={styles.editBtn} onClick={() => setIsEditing(true)}>
                <Edit2 size={14} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <div style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Business Name *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.businessName}
                  onChange={handleChange('businessName')}
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  style={styles.input}
                  value={formData.businessPhone}
                  onChange={handleChange('businessPhone')}
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Address</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.businessAddress}
                  onChange={handleChange('businessAddress')}
                  disabled={loading}
                />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 2 }}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.businessCity}
                    onChange={handleChange('businessCity')}
                    disabled={loading}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>State</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.businessState}
                    onChange={handleChange('businessState')}
                    disabled={loading}
                    maxLength={2}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>ZIP</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.businessZip}
                    onChange={handleChange('businessZip')}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Website</label>
                <input
                  type="url"
                  style={styles.input}
                  value={formData.businessWebsite}
                  onChange={handleChange('businessWebsite')}
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, ...styles.textarea }}
                  value={formData.businessDescription}
                  onChange={handleChange('businessDescription')}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div style={styles.editActions}>
                <button style={styles.cancelBtn} onClick={handleCancel} disabled={loading}>
                  <X size={16} />
                  Cancel
                </button>
                <button style={styles.saveBtn} onClick={handleSave} disabled={loading}>
                  {loading ? <div style={styles.spinner} /> : 'Save Changes'}
                </button>
              </div>

              <p style={styles.editNote}>
                Editing your application will not affect your place in the review queue.
              </p>
            </div>
          ) : (
            <div style={styles.infoCard}>
              <div style={styles.infoRow}>
                <Store size={18} color="#94a3b8" />
                <span style={styles.businessName}>{locationProfile?.location_business_name}</span>
              </div>
              {locationProfile?.location_business_phone && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Phone:</span>
                  <span style={styles.infoValue}>{locationProfile.location_business_phone}</span>
                </div>
              )}
              {(locationProfile?.location_business_address || locationProfile?.location_business_city) && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Address:</span>
                  <span style={styles.infoValue}>
                    {[
                      locationProfile.location_business_address,
                      locationProfile.location_business_city,
                      locationProfile.location_business_state,
                      locationProfile.location_business_zip
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {locationProfile?.location_business_website && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Website:</span>
                  <span style={styles.infoValue}>{locationProfile.location_business_website}</span>
                </div>
              )}
              {locationProfile?.location_business_description && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>About:</span>
                  <span style={styles.infoValue}>{locationProfile.location_business_description}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={handleSignOut} style={styles.signOutBtn}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  content: {
    width: '100%',
    maxWidth: '480px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 12,
    objectFit: 'cover',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  statusIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statusLabel: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  statusValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f59e0b',
  },
  timestamps: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  timestamp: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  timestampLabel: {
    fontSize: '11px',
    color: '#6a6a6a',
    textTransform: 'uppercase',
  },
  timestampValue: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  infoMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '10px',
    color: '#22c55e',
    fontSize: '13px',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '14px',
  },
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid #22c55e',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#22c55e',
    fontSize: '13px',
    marginBottom: '14px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '13px',
    cursor: 'pointer',
  },
  infoCard: {
    padding: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #2a2a2a',
  },
  businessName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '10px',
  },
  infoLabel: {
    fontSize: '11px',
    color: '#6a6a6a',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '80px',
  },
  editActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0ea5e9',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  editNote: {
    fontSize: '12px',
    color: '#6a6a6a',
    textAlign: 'center',
    marginTop: '4px',
  },
  signOutBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#6a6a6a',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default PendingApproval;
