import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Shield,
  Clock,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Phone,
  Globe,
  Store,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import logo from '../assets/logo.png';

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(null); // null = loading, false = not admin, true = admin
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  // Check if current user is admin
  const checkAdmin = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_id', user.id)
      .single();

    if (error || !data?.is_admin) {
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
  }, [user?.id]);

  // Fetch applications based on filter
  const fetchApplications = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('locations')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('application_approved', false).eq('rejected', false);
    } else if (filter === 'approved') {
      query = query.eq('application_approved', true);
    } else if (filter === 'rejected') {
      query = query.eq('rejected', true);
    }
    // 'all' has no filter

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } else if (data && data.length > 0) {
      // Fetch owner info for each location
      const ownerIds = [...new Set(data.map(d => d.owner_id).filter(Boolean))];
      if (ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from('users')
          .select('auth_id, email, first_name, last_name')
          .in('auth_id', ownerIds);

        const ownerMap = {};
        owners?.forEach(o => {
          ownerMap[o.auth_id] = o;
        });

        // Attach owner info to each location
        const appsWithOwners = data.map(app => ({
          ...app,
          owner: ownerMap[app.owner_id] || null
        }));
        setApplications(appsWithOwners);
      } else {
        setApplications(data);
      }
    } else {
      setApplications([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin, fetchApplications]);

  // When selecting an app, load its notes
  useEffect(() => {
    if (selectedApp) {
      setNotes(selectedApp.admin_notes || '');
      setRejectionReason(selectedApp.rejection_reason || '');
    }
  }, [selectedApp]);

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionLoading(true);

    // application_approved = can access dashboard
    // verified stays false until they complete profile (hours, content, tier)
    const { error } = await supabase
      .from('locations')
      .update({
        application_approved: true,
        rejected: false,
        admin_notes: notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', selectedApp.id);

    if (error) {
      console.error('Error approving:', error);
      alert('Failed to approve');
    } else {
      setSelectedApp(null);
      fetchApplications();
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);

    const { error } = await supabase
      .from('locations')
      .update({
        verified: false,
        rejected: true,
        rejection_reason: rejectionReason,
        admin_notes: notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', selectedApp.id);

    if (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject');
    } else {
      setSelectedApp(null);
      fetchApplications();
    }
    setActionLoading(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('locations')
      .update({ admin_notes: notes })
      .eq('id', selectedApp.id);

    if (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } else {
      // Update local state
      setSelectedApp({ ...selectedApp, admin_notes: notes });
      setApplications(apps =>
        apps.map(a => a.id === selectedApp.id ? { ...a, admin_notes: notes } : a)
      );
    }
    setActionLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // If not logged in, redirect to login
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContent}>
          <Shield size={48} color="#6a6a6a" />
          <h1 style={styles.deniedTitle}>Login Required</h1>
          <p style={styles.deniedText}>Please log in to access admin panel.</p>
          <button onClick={() => navigate('/login')} style={styles.backButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAdmin === null) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContent}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  // Not admin - show access denied
  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContent}>
          <Shield size={48} color="#ef4444" />
          <h1 style={styles.deniedTitle}>Access Denied</h1>
          <p style={styles.deniedText}>You don't have admin privileges.</p>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Detail view
  if (selectedApp) {
    const isPending = !selectedApp.application_approved && !selectedApp.rejected;

    return (
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Back button */}
          <button onClick={() => setSelectedApp(null)} style={styles.backNav}>
            <ChevronLeft size={20} />
            <span>Back to Applications</span>
          </button>

          {/* Status badge */}
          <div style={{
            ...styles.statusBadge,
            backgroundColor: selectedApp.application_approved
              ? 'rgba(34, 197, 94, 0.15)'
              : selectedApp.rejected
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
            color: selectedApp.application_approved
              ? '#22c55e'
              : selectedApp.rejected
                ? '#ef4444'
                : '#f59e0b'
          }}>
            {selectedApp.application_approved ? 'Approved' : selectedApp.rejected ? 'Rejected' : 'Pending Review'}
          </div>

          {/* Business name */}
          <h1 style={styles.detailTitle}>{selectedApp.store_name}</h1>

          {/* Owner info */}
          <div style={styles.detailCard}>
            <div style={styles.detailRow}>
              <User size={16} color="#6a6a6a" />
              <span style={styles.detailLabel}>Owner</span>
              <span style={styles.detailValue}>
                {selectedApp.owner?.first_name} {selectedApp.owner?.last_name}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={{ marginLeft: 24 }}>{selectedApp.owner?.email}</span>
            </div>
          </div>

          {/* Business details */}
          <div style={styles.detailCard}>
            <div style={styles.detailRow}>
              <MapPin size={16} color="#6a6a6a" />
              <span style={styles.detailLabel}>Address</span>
            </div>
            <div style={styles.detailAddress}>
              {selectedApp.address && <div>{selectedApp.address}</div>}
              <div>{selectedApp.city}, {selectedApp.state} {selectedApp.zip_code}</div>
            </div>

            {selectedApp.phone && (
              <div style={styles.detailRow}>
                <Phone size={16} color="#6a6a6a" />
                <span style={styles.detailLabel}>Phone</span>
                <a href={`tel:${selectedApp.phone}`} style={styles.detailLink}>
                  {selectedApp.phone}
                </a>
              </div>
            )}

            {selectedApp.website && (
              <div style={styles.detailRow}>
                <Globe size={16} color="#6a6a6a" />
                <span style={styles.detailLabel}>Website</span>
                <a href={selectedApp.website} target="_blank" rel="noopener noreferrer" style={styles.detailLink}>
                  {selectedApp.website}
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {selectedApp.description && (
            <div style={styles.detailCard}>
              <div style={styles.detailRow}>
                <FileText size={16} color="#6a6a6a" />
                <span style={styles.detailLabel}>Description</span>
              </div>
              <p style={styles.detailDescription}>{selectedApp.description}</p>
            </div>
          )}

          {/* Timestamps */}
          <div style={styles.detailCard}>
            <div style={styles.detailRow}>
              <Calendar size={16} color="#6a6a6a" />
              <span style={styles.detailLabel}>Submitted</span>
              <span style={styles.detailValue}>{formatDate(selectedApp.submitted_at)}</span>
            </div>
            {selectedApp.reviewed_at && (
              <div style={styles.detailRow}>
                <Check size={16} color="#6a6a6a" />
                <span style={styles.detailLabel}>Reviewed</span>
                <span style={styles.detailValue}>{formatDate(selectedApp.reviewed_at)}</span>
              </div>
            )}
          </div>

          {/* Admin notes */}
          <div style={styles.detailCard}>
            <label style={styles.notesLabel}>Admin Notes</label>
            <textarea
              style={styles.notesInput}
              placeholder="Notes from Zoom call, verification details, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <button
              onClick={handleSaveNotes}
              style={styles.saveNotesBtn}
              disabled={actionLoading}
            >
              Save Notes
            </button>
          </div>

          {/* Action buttons - only show for pending */}
          {isPending && (
            <div style={styles.actionSection}>
              <button
                onClick={handleApprove}
                style={styles.approveBtn}
                disabled={actionLoading}
              >
                <Check size={18} />
                <span>Approve</span>
              </button>

              <div style={styles.rejectSection}>
                <input
                  type="text"
                  style={styles.rejectInput}
                  placeholder="Rejection reason (required)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <button
                  onClick={handleReject}
                  style={styles.rejectBtn}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  <X size={18} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          {/* Show rejection reason if rejected */}
          {selectedApp.rejected && selectedApp.rejection_reason && (
            <div style={styles.rejectionCard}>
              <strong>Rejection Reason:</strong>
              <p>{selectedApp.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Back to Dashboard */}
        <button onClick={() => navigate('/')} style={styles.backToDash}>
          <ChevronLeft size={18} />
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div style={styles.header}>
          <img src={logo} alt="CardChase" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Admin Panel</h1>
            <p style={styles.subtitle}>Manage partner applications</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={styles.filterTabs}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterTab,
                ...(filter === f ? styles.filterTabActive : {})
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
          </div>
        ) : applications.length === 0 ? (
          <div style={styles.emptyState}>
            <Store size={40} color="#4a4a4a" />
            <p>No {filter} applications</p>
          </div>
        ) : (
          <div style={styles.list}>
            {applications.map(app => (
              <div
                key={app.id}
                style={styles.appCard}
                onClick={() => setSelectedApp(app)}
              >
                <div style={styles.appHeader}>
                  <div style={styles.appName}>{app.store_name}</div>
                  <ChevronRight size={18} color="#6a6a6a" />
                </div>
                <div style={styles.appMeta}>
                  <span>{app.city}, {app.state}</span>
                  <span style={styles.appDot} />
                  <Clock size={12} />
                  <span>{formatDate(app.submitted_at)}</span>
                </div>
                {app.owner?.email && (
                  <div style={styles.appOwner}>{app.owner.email}</div>
                )}
                {app.admin_notes && (
                  <div style={styles.hasNotes}>Has notes</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sign out */}
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
    padding: '20px',
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  centerContent: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#0ea5e9',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  deniedTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  deniedText: {
    color: '#94a3b8',
    margin: 0,
  },
  backButton: {
    marginTop: '16px',
    padding: '10px 20px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
  },
  backToDash: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 0',
    marginBottom: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0ea5e9',
    fontSize: '14px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: 'cover',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6a6a6a',
    margin: 0,
  },
  filterTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
  },
  filterTab: {
    padding: '8px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '20px',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  filterTabActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
    color: '#ffffff',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '60px 20px',
    color: '#6a6a6a',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  appCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
  },
  appHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  appName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  appMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#6a6a6a',
  },
  appDot: {
    width: '3px',
    height: '3px',
    backgroundColor: '#4a4a4a',
    borderRadius: '50%',
  },
  appOwner: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '6px',
  },
  hasNotes: {
    marginTop: '8px',
    fontSize: '11px',
    color: '#0ea5e9',
    fontWeight: '500',
  },
  signOutBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#6a6a6a',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '24px',
  },
  // Detail view styles
  backNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0ea5e9',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  detailTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 20px 0',
  },
  detailCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6a6a6a',
    minWidth: '70px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#ffffff',
  },
  detailAddress: {
    marginLeft: '26px',
    fontSize: '14px',
    color: '#ffffff',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  detailLink: {
    fontSize: '14px',
    color: '#0ea5e9',
    textDecoration: 'none',
  },
  detailDescription: {
    marginLeft: '26px',
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.5',
    margin: '8px 0 0 26px',
  },
  notesLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '8px',
  },
  notesInput: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  saveNotesBtn: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#2a2a2a',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '13px',
    cursor: 'pointer',
  },
  actionSection: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  approveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    backgroundColor: '#22c55e',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  rejectSection: {
    display: 'flex',
    gap: '10px',
  },
  rejectInput: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
  },
  rejectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 16px',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  rejectionCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '14px',
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '16px',
  },
};

// Add keyframes for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Admin;
