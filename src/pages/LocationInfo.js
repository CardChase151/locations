import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Clock, CreditCard, Users, Store, MapPin, ChevronRight, Eye, Calendar } from 'lucide-react';

const LocationInfo = () => {
  const navigate = useNavigate();
  const { locationRecord, refreshData } = useLocation();
  const [isVisibleOnApp, setIsVisibleOnApp] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  useEffect(() => {
    if (locationRecord) {
      setIsVisibleOnApp(locationRecord.visible_on_app || false);
    }
  }, [locationRecord]);

  const handleToggleVisibility = async () => {
    if (!locationRecord?.verified || togglingVisibility) return;

    setTogglingVisibility(true);
    try {
      const newValue = !isVisibleOnApp;
      const { error } = await supabase
        .from('locations')
        .update({ visible_on_app: newValue })
        .eq('id', locationRecord.id);

      if (error) throw error;
      setIsVisibleOnApp(newValue);
      if (refreshData) refreshData();
    } catch (err) {
      console.error('Error toggling visibility:', err);
      alert('Error updating visibility');
    } finally {
      setTogglingVisibility(false);
    }
  };

  const settingsItems = [
    {
      icon: Calendar,
      title: 'Weekly Events',
      subtitle: 'Trade nights, tournaments, card shows',
      path: '/events',
      color: '#8b5cf6',
    },
    {
      icon: Clock,
      title: 'Operating Hours',
      subtitle: 'Set your weekly schedule',
      path: '/hours',
      color: '#0ea5e9',
    },
    {
      icon: CreditCard,
      title: 'Subscription Plan',
      subtitle: 'View or upgrade your plan',
      path: '/upgrade',
      color: '#f59e0b',
    },
    {
      icon: Users,
      title: 'Manage Staff',
      subtitle: 'Add or remove team members',
      path: '/staff',
      color: '#22c55e',
    },
    {
      icon: Store,
      title: 'Business Information',
      subtitle: 'Store name, contact, description',
      path: '/info/business',
      color: '#f59e0b',
    },
    {
      icon: MapPin,
      title: 'Address',
      subtitle: 'Location and coordinates',
      path: '/info/address',
      color: '#ef4444',
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <h1 style={styles.title}>Location Settings</h1>
        <p style={styles.subtitle}>{locationRecord?.store_name}</p>

        {/* Visibility Toggle */}
        <div style={styles.visibilityCard}>
          <div style={styles.visibilityInfo}>
            <div style={{
              ...styles.visibilityIcon,
              backgroundColor: isVisibleOnApp ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 100, 100, 0.15)',
              color: isVisibleOnApp ? '#22c55e' : '#6a6a6a',
            }}>
              <Eye size={22} />
            </div>
            <div style={styles.visibilityText}>
              <span style={styles.visibilityLabel}>Visible on App</span>
              <span style={styles.visibilityDesc}>
                {!locationRecord?.verified
                  ? 'Pending admin approval'
                  : isVisibleOnApp
                    ? 'Traders can find your store'
                    : 'Your store is hidden'}
              </span>
            </div>
          </div>
          <button
            style={{
              ...styles.visibilityToggle,
              backgroundColor: isVisibleOnApp ? '#22c55e' : '#3a3a3a',
              opacity: !locationRecord?.verified || togglingVisibility ? 0.5 : 1,
              cursor: !locationRecord?.verified || togglingVisibility ? 'not-allowed' : 'pointer',
            }}
            onClick={handleToggleVisibility}
            disabled={!locationRecord?.verified || togglingVisibility}
          >
            <div
              style={{
                ...styles.visibilityToggleKnob,
                transform: isVisibleOnApp ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          </button>
        </div>

        {/* Settings List */}
        <div style={styles.settingsList}>
          {settingsItems.map((item) => (
            <div
              key={item.path}
              style={styles.settingCard}
              onClick={() => navigate(item.path)}
            >
              <div style={{
                ...styles.settingIcon,
                backgroundColor: `${item.color}20`,
                color: item.color,
              }}>
                <item.icon size={22} />
              </div>
              <div style={styles.settingContent}>
                <span style={styles.settingTitle}>{item.title}</span>
                <span style={styles.settingSubtitle}>{item.subtitle}</span>
              </div>
              <ChevronRight size={20} color="#6a6a6a" />
            </div>
          ))}
        </div>
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
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6a6a6a',
    margin: '0 0 20px 0',
  },
  visibilityCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  visibilityInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  visibilityIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
  },
  visibilityText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  visibilityLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  visibilityDesc: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  visibilityToggle: {
    width: '48px',
    height: '28px',
    borderRadius: '14px',
    border: 'none',
    padding: '2px',
    transition: 'background-color 0.2s',
  },
  visibilityToggleKnob: {
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  settingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  settingIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  settingTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  settingSubtitle: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
};

export default LocationInfo;
