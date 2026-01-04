import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Store, Clock } from 'lucide-react';
import logo from '../assets/logo.png';

const IntakeForm = () => {
  const navigate = useNavigate();
  const { submitApplication } = useLocation();
  const { user, signOut } = useAuth();

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
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch user's name from database
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('auth_id', user.id)
        .single();
      setUserInfo(data);
    };
    fetchUserInfo();
  }, [user?.id]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return;
    }

    setLoading(true);
    setError('');

    const { error: submitError } = await submitApplication({
      businessName: formData.businessName.trim(),
      businessPhone: formData.businessPhone.trim(),
      businessAddress: formData.businessAddress.trim(),
      businessCity: formData.businessCity.trim(),
      businessState: formData.businessState.trim(),
      businessZip: formData.businessZip.trim(),
      businessWebsite: formData.businessWebsite.trim(),
      businessDescription: formData.businessDescription.trim(),
    });

    if (submitError) {
      setError(submitError.message || 'Failed to submit. Please try again.');
      setLoading(false);
    } else {
      navigate('/pending');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <img src={logo} alt="CardChase" style={styles.logo} />
          <h1 style={styles.title}>Partner Application</h1>
          <p style={styles.subtitle}>Apply to list your store on CardChase</p>
        </div>

        {/* Info banner */}
        <div style={styles.infoBanner}>
          <Clock size={18} style={{ flexShrink: 0 }} />
          <span>Applications are reviewed in the order received. You'll be notified once approved.</span>
        </div>

        <div style={styles.userInfo}>
          <span style={styles.userLabel}>Applying as:</span>
          <div style={styles.userDetails}>
            {userInfo?.first_name && (
              <span style={styles.userName}>
                {userInfo.first_name} {userInfo.last_name || ''}
              </span>
            )}
            <span style={styles.userEmail}>{user?.email}</span>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Business Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Name *</label>
            <input
              type="text"
              style={styles.input}
              placeholder="Epic Card Games"
              value={formData.businessName}
              onChange={handleChange('businessName')}
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Phone</label>
            <input
              type="tel"
              style={styles.input}
              placeholder="(555) 123-4567"
              value={formData.businessPhone}
              onChange={handleChange('businessPhone')}
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Street Address</label>
            <input
              type="text"
              style={styles.input}
              placeholder="123 Main Street"
              value={formData.businessAddress}
              onChange={handleChange('businessAddress')}
              disabled={loading}
            />
          </div>

          {/* City, State, Zip row */}
          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 2 }}>
              <label style={styles.label}>City</label>
              <input
                type="text"
                style={styles.input}
                placeholder="San Diego"
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
                placeholder="CA"
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
                placeholder="92101"
                value={formData.businessZip}
                onChange={handleChange('businessZip')}
                disabled={loading}
              />
            </div>
          </div>

          {/* Website */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Website (optional)</label>
            <input
              type="url"
              style={styles.input}
              placeholder="https://epiccardgames.com"
              value={formData.businessWebsite}
              onChange={handleChange('businessWebsite')}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tell us about your store (optional)</label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              placeholder="What games do you sell? Do you host events? Anything you'd like us to know..."
              value={formData.businessDescription}
              onChange={handleChange('businessDescription')}
              disabled={loading}
              rows={4}
            />
          </div>

          <button type="submit" style={styles.submit} disabled={loading}>
            {loading ? (
              <div style={styles.spinner} />
            ) : (
              <>
                <Store size={18} />
                <span>Submit Application</span>
              </>
            )}
          </button>

          <p style={styles.disclaimer}>
            By submitting, you agree to be contacted about your application.
            Your store will appear on CardChase once approved.
          </p>
        </form>

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
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  infoBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    border: '1px solid rgba(14, 165, 233, 0.3)',
    borderRadius: '10px',
    color: '#0ea5e9',
    fontSize: '13px',
    marginBottom: '16px',
    lineHeight: '1.4',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
    padding: '12px 14px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
  },
  userLabel: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userName: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '600',
  },
  userEmail: {
    fontSize: '13px',
    color: '#94a3b8',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#ffffff',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '100px',
  },
  submit: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: '#0ea5e9',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  disclaimer: {
    fontSize: '12px',
    color: '#6a6a6a',
    textAlign: 'center',
    lineHeight: '1.5',
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
    marginTop: '20px',
  },
};

export default IntakeForm;
