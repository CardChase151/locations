import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Users, Plus, X, Search, Trash2, Shield } from 'lucide-react';

const ManageStaff = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locationRecord } = useLocation();

  // Staff state
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingStaff, setAddingStaff] = useState(null);

  // Get current user's staff record to check permissions
  const [myStaffRecord, setMyStaffRecord] = useState(null);

  const fetchMyStaffRecord = async () => {
    if (!user?.id || !locationRecord?.id) return;

    await supabase
      .from('location_staff')
      .select('role, can_add_staff')
      .eq('location_id', locationRecord.id)
      .eq('status', 'active')
      .single();

    // Match by checking users table
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userData) {
      const { data: staffData } = await supabase
        .from('location_staff')
        .select('role, can_add_staff')
        .eq('location_id', locationRecord.id)
        .eq('user_id', userData.id)
        .eq('status', 'active')
        .single();

      setMyStaffRecord(staffData);
    }
  };

  const fetchStaff = async () => {
    if (!locationRecord?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('location_staff')
      .select(`
        id,
        role,
        status,
        can_add_staff,
        invited_at,
        accepted_at,
        users:user_id (
          id,
          username,
          first_name,
          last_name,
          email
        )
      `)
      .eq('location_id', locationRecord.id)
      .in('status', ['active', 'pending'])
      .order('role', { ascending: true });

    if (!error && data) {
      setStaff(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (locationRecord?.id) {
      fetchStaff();
      fetchMyStaffRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationRecord?.id]);

  const searchUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, email')
      .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      const staffUserIds = staff.map(s => s.users?.id);
      const filtered = data.filter(u => !staffUserIds.includes(u.id));
      setSearchResults(filtered);
    }
    setSearching(false);
  };

  const handleAddStaff = async (userToAdd) => {
    if (!locationRecord?.id) return;

    // Get current user's id
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    setAddingStaff(userToAdd.id);
    const { error } = await supabase
      .from('location_staff')
      .upsert({
        location_id: locationRecord.id,
        user_id: userToAdd.id,
        role: 'staff',
        status: 'active',
        can_add_staff: false,
        invited_by: currentUser?.id,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      }, { onConflict: 'location_id,user_id' });

    if (!error) {
      await fetchStaff();
      setSearchQuery('');
      setSearchResults([]);
      setShowAddStaff(false);
    }
    setAddingStaff(null);
  };

  const handleRemoveStaff = async (staffId) => {
    if (!window.confirm('Remove this staff member?')) return;

    await supabase
      .from('location_staff')
      .update({ status: 'removed' })
      .eq('id', staffId);

    await fetchStaff();
  };

  const handleToggleAdmin = async (staffRecord) => {
    const newCanAddStaff = !staffRecord.can_add_staff;
    await supabase
      .from('location_staff')
      .update({
        can_add_staff: newCanAddStaff,
        role: newCanAddStaff ? 'admin' : 'staff',
      })
      .eq('id', staffRecord.id);

    await fetchStaff();
  };

  const canManageStaff = myStaffRecord?.role === 'owner' || myStaffRecord?.can_add_staff;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 style={styles.title}>Manage Staff</h1>
            <p style={styles.subtitle}>{locationRecord?.store_name}</p>
          </div>
        </div>

        {/* Add Staff Button */}
        {canManageStaff && (
          <button style={styles.addButton} onClick={() => setShowAddStaff(true)}>
            <Plus size={20} />
            <span>Add Staff Member</span>
          </button>
        )}

        {/* Staff List */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Staff Members</h2>

          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : staff.length === 0 ? (
            <div style={styles.empty}>
              <Users size={32} color="#6a6a6a" />
              <p>No staff members yet</p>
            </div>
          ) : (
            <div style={styles.staffList}>
              {staff.map((s) => (
                <div key={s.id} style={styles.staffCard}>
                  <div style={styles.staffInfo}>
                    <span style={styles.staffName}>
                      {s.users?.first_name || s.users?.username || 'Unknown'}
                    </span>
                    <span style={styles.staffUsername}>
                      @{s.users?.username || 'unknown'}
                    </span>
                    <div style={styles.staffMeta}>
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: s.role === 'owner' ? 'rgba(139, 92, 246, 0.15)' :
                                        s.role === 'admin' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100, 100, 100, 0.15)',
                        color: s.role === 'owner' ? '#8b5cf6' :
                               s.role === 'admin' ? '#3b82f6' : '#888',
                      }}>
                        {s.role}
                      </span>
                    </div>
                  </div>

                  {/* Actions - only for owner viewing non-owners */}
                  {myStaffRecord?.role === 'owner' && s.role !== 'owner' && (
                    <div style={styles.staffActions}>
                      <button
                        style={{
                          ...styles.adminToggle,
                          backgroundColor: s.can_add_staff ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                          borderColor: s.can_add_staff ? '#3b82f6' : '#3a3a3a',
                        }}
                        onClick={() => handleToggleAdmin(s)}
                        title={s.can_add_staff ? 'Remove admin' : 'Make admin'}
                      >
                        <Shield size={14} />
                      </button>
                      <button
                        style={styles.removeButton}
                        onClick={() => handleRemoveStaff(s.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowAddStaff(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Staff Member</h3>
              <button style={styles.modalClose} onClick={() => setShowAddStaff(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.searchContainer}>
              <Search size={18} color="#6a6a6a" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.searchResults}>
              {searching ? (
                <p style={styles.searchingText}>Searching...</p>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <p style={styles.noResults}>No users found</p>
              ) : (
                searchResults.map((u) => (
                  <div key={u.id} style={styles.searchResult}>
                    <div style={styles.searchResultInfo}>
                      <span style={styles.searchResultName}>
                        {u.first_name || u.username}
                      </span>
                      <span style={styles.searchResultUsername}>@{u.username}</span>
                    </div>
                    <button
                      style={styles.addUserButton}
                      onClick={() => handleAddStaff(u)}
                      disabled={addingStaff === u.id}
                    >
                      {addingStaff === u.id ? '...' : 'Add'}
                    </button>
                  </div>
                ))
              )}
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '24px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: 0,
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6a6a6a',
    margin: 0,
  },
  addButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6a6a6a',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  loading: {
    textAlign: 'center',
    padding: '32px',
    color: '#6a6a6a',
  },
  empty: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6a6a6a',
  },
  staffList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  staffCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
  },
  staffInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  staffName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  staffUsername: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  staffMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  staffActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  adminToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid #3a3a3a',
    borderRadius: '6px',
    background: 'transparent',
    color: '#6a6a6a',
    cursor: 'pointer',
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    padding: '20px',
    maxHeight: '70vh',
    overflowY: 'auto',
    zIndex: 1001,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#6a6a6a',
    cursor: 'pointer',
    padding: 0,
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#0a0a0a',
    borderRadius: '10px',
    border: '1px solid #2a2a2a',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#ffffff',
  },
  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  searchingText: {
    textAlign: 'center',
    padding: '24px',
    color: '#6a6a6a',
  },
  noResults: {
    textAlign: 'center',
    padding: '24px',
    color: '#6a6a6a',
  },
  searchResult: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
  },
  searchResultInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  searchResultName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
  },
  searchResultUsername: {
    fontSize: '12px',
    color: '#6a6a6a',
  },
  addUserButton: {
    padding: '8px 16px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default ManageStaff;
