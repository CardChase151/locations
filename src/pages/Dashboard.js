import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Eye, Users, ChevronRight, Calendar, Settings } from 'lucide-react';
import logo from '../assets/logo.png';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { locationRecord } = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ views: 0, trades: 0, followers: 0 });

  // Upcoming trades
  const [upcomingTrades, setUpcomingTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('auth_id', user.id)
        .single();
      setIsAdmin(data?.is_admin || false);
    };
    checkAdmin();
  }, [user?.id]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!locationRecord?.id) return;

      const { count: followerCount } = await supabase
        .from('location_followers')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationRecord.id);

      // Count upcoming trades
      const { count: tradeCount } = await supabase
        .from('trade_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationRecord.id)
        .eq('status', 'confirmed');

      setStats(prev => ({
        ...prev,
        followers: followerCount || 0,
        trades: tradeCount || 0,
      }));
    };
    fetchStats();
  }, [locationRecord?.id]);

  // Get today's date string for filtering
  const getTodayString = () => {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}`;
  };

  // Fetch today's trades
  useEffect(() => {
    const fetchTrades = async () => {
      if (!locationRecord?.id) return;

      setTradesLoading(true);
      const { data, error } = await supabase
        .from('trade_schedules')
        .select(`
          id,
          selected_date,
          selected_time,
          status,
          trade_requests (
            id,
            requester:users!trade_requests_requester_id_fkey (
              username,
              first_name
            ),
            card_owner:users!trade_requests_card_owner_id_fkey (
              username,
              first_name
            ),
            cards (
              name,
              digital_image_url,
              original_image_url
            )
          )
        `)
        .eq('location_id', locationRecord.id)
        .eq('status', 'confirmed')
        .order('selected_time', { ascending: true });

      if (!error && data) {
        // Filter to today only
        const todayStr = getTodayString();
        const todayTrades = data.filter(t => t.selected_date === todayStr);
        setUpcomingTrades(todayTrades);
      }
      setTradesLoading(false);
    };
    fetchTrades();
  }, [locationRecord?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <img src={logo} alt="CardChase" style={styles.logo} />
            <div>
              <h1 style={styles.title}>Location Portal</h1>
              <p style={styles.subtitle}>{locationRecord?.store_name || 'Dashboard'}</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} style={styles.adminBtn} title="Admin Panel">
              <Shield size={20} />
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <Eye size={20} color="#0ea5e9" />
            <div style={styles.statValue}>{stats.views}</div>
            <div style={styles.statLabel}>Views</div>
          </div>
          <div style={styles.statCard}>
            <Users size={20} color="#22c55e" />
            <div style={styles.statValue}>{stats.followers}</div>
            <div style={styles.statLabel}>Followers</div>
          </div>
          <div style={styles.statCard}>
            <Calendar size={20} color="#f59e0b" />
            <div style={styles.statValue}>{stats.trades}</div>
            <div style={styles.statLabel}>Trades</div>
          </div>
        </div>

        {/* Today's Trades */}
        <div style={styles.section}>
          <div style={styles.sectionHeader} onClick={() => navigate('/schedule')}>
            <h2 style={styles.sectionTitle}>Today</h2>
            <div style={styles.viewAll}>
              <span>View Schedule</span>
              <ChevronRight size={16} />
            </div>
          </div>

          {tradesLoading ? (
            <div style={styles.loadingTrades}>Loading...</div>
          ) : upcomingTrades.length === 0 ? (
            <div style={styles.emptyTrades} onClick={() => navigate('/schedule')}>
              <Calendar size={32} color="#6a6a6a" />
              <p>No trades scheduled for today</p>
              <span style={styles.viewScheduleLink}>View full schedule</span>
            </div>
          ) : (
            <div style={styles.tradesList}>
              {upcomingTrades.map((trade) => {
                const request = trade.trade_requests;
                const requester = request?.requester;
                const owner = request?.card_owner;
                const cardImage = request?.cards?.digital_image_url || request?.cards?.original_image_url;

                return (
                  <div key={trade.id} style={styles.tradeCard} onClick={() => navigate('/schedule')}>
                    {cardImage && (
                      <img
                        src={cardImage}
                        alt={request?.cards?.name || 'Card'}
                        style={styles.tradeCardImage}
                      />
                    )}
                    <div style={styles.tradeInfo}>
                      <span style={styles.tradeTime}>{trade.selected_time}</span>
                      <span style={styles.tradeUsers}>
                        @{requester?.username || 'user'} & @{owner?.username || 'user'}
                      </span>
                      {request?.cards?.name && (
                        <span style={styles.tradeCardName}>{request.cards.name}</span>
                      )}
                    </div>
                    <ChevronRight size={18} color="#6a6a6a" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Management Buttons */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Manage</h2>

          <div style={styles.actionCard} onClick={() => navigate('/info')}>
            <div style={styles.actionIcon}>
              <Settings size={20} />
            </div>
            <div style={styles.actionContent}>
              <span style={styles.actionTitle}>Location Settings</span>
              <span style={styles.actionSubtitle}>Info, hours, and plan</span>
            </div>
            <ChevronRight size={18} color="#6a6a6a" />
          </div>

          <div style={styles.actionCard} onClick={() => navigate('/staff')}>
            <div style={styles.actionIcon}>
              <Users size={20} />
            </div>
            <div style={styles.actionContent}>
              <span style={styles.actionTitle}>Manage Staff</span>
              <span style={styles.actionSubtitle}>Add or remove team members</span>
            </div>
            <ChevronRight size={18} color="#6a6a6a" />
          </div>
        </div>

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
    color: '#ffffff',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    objectFit: 'cover',
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
  adminBtn: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#0ea5e9',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    marginTop: '8px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6a6a6a',
    marginTop: '4px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    cursor: 'pointer',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6a6a6a',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  viewAll: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#0ea5e9',
    fontWeight: '500',
  },
  viewScheduleLink: {
    fontSize: '13px',
    color: '#0ea5e9',
    marginTop: '8px',
  },
  loadingTrades: {
    textAlign: 'center',
    padding: '32px',
    color: '#6a6a6a',
  },
  emptyTrades: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6a6a6a',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
  },
  tradesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tradeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  tradeCardImage: {
    width: '50px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '4px',
    flexShrink: 0,
  },
  tradeInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tradeTime: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#8b5cf6',
  },
  tradeUsers: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
  },
  tradeCardName: {
    fontSize: '12px',
    color: '#6a6a6a',
  },
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '10px',
    cursor: 'pointer',
  },
  actionIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: '10px',
    color: '#ffffff',
  },
  actionContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  actionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  actionSubtitle: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  signOutBtn: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#6a6a6a',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '12px',
  },
};

export default Dashboard;
