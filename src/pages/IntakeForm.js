import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const IntakeForm = () => {
  const navigate = useNavigate();
  const { completeIntake } = useLocation();
  const { user, signOut } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    setLoading(true);
    setError('');

    const { error: submitError } = await completeIntake({
      businessName: businessName.trim(),
      businessPhone: businessPhone.trim(),
      businessAddress: businessAddress.trim(),
    });

    if (submitError) {
      setError(submitError.message || 'Failed to save. Please try again.');
      setLoading(false);
    } else {
      navigate('/');
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
          <h1 style={styles.title}>Location Setup</h1>
          <p style={styles.subtitle}>Tell us about your business</p>
          <span style={styles.badge}>Step 1 of 1</span>
        </div>

        <div style={styles.userInfo}>
          <span style={styles.userLabel}>Signed in as:</span>
          <span style={styles.userEmail}>{user?.email}</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Name *</label>
            <input
              type="text"
              style={styles.input}
              placeholder="Epic Card Games"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Phone</label>
            <input
              type="tel"
              style={styles.input}
              placeholder="(555) 123-4567"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Address</label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              placeholder="123 Main St, City, State 12345"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <button type="submit" style={styles.submit} disabled={loading}>
            {loading ? <div style={styles.spinner} /> : 'Complete Setup'}
          </button>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  content: {
    width: '100%',
    maxWidth: '400px',
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
  badge: {
    display: 'inline-block',
    background: 'rgba(14, 165, 233, 0.15)',
    color: '#0ea5e9',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    marginTop: '12px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
  },
  userLabel: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  userEmail: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
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
    minHeight: '80px',
  },
  submit: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#0ea5e9',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
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
    marginTop: '16px',
  },
};

export default IntakeForm;
