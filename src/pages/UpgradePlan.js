import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Check, X, Star, Zap, Crown, Gift } from 'lucide-react';

const PLANS = [
  {
    tier: 0,
    name: 'Free',
    price: '$0',
    priceNote: 'forever',
    icon: Gift,
    color: '#6b7280',
    tagline: 'Just get listed',
    features: {
      clickableProfile: false,
      badge: 'None',
      searchBoost: 'None',
      shopPhotos: '0',
      eventNights: '0',
      specialEvents: '0',
      eventPhotos: '0',
      rsvpTracking: false,
      analytics: false,
      notifyFollowers: false,
      stateAlerts: false,
      awardEligible: false,
      loyaltyProgram: false,
    },
  },
  {
    tier: 1,
    name: 'Basic',
    price: '$50',
    priceNote: '/month',
    icon: Star,
    color: '#0ea5e9',
    tagline: 'Establish your presence',
    features: {
      clickableProfile: true,
      badge: 'None',
      searchBoost: 'None',
      shopPhotos: '1',
      eventNights: '2',
      specialEvents: '0',
      eventPhotos: '3',
      rsvpTracking: true,
      analytics: false,
      notifyFollowers: false,
      stateAlerts: false,
      awardEligible: true,
      loyaltyProgram: false,
    },
  },
  {
    tier: 2,
    name: 'Enhanced',
    price: '$150',
    priceNote: '/month',
    icon: Zap,
    color: '#22c55e',
    tagline: 'Stand out and grow',
    recommended: true,
    features: {
      clickableProfile: true,
      badge: 'Verified',
      searchBoost: '10 miles',
      shopPhotos: '5',
      eventNights: '2',
      specialEvents: '4/year',
      eventPhotos: '10',
      rsvpTracking: true,
      analytics: 'Full dashboard',
      notifyFollowers: '1x/week',
      stateAlerts: false,
      awardEligible: true,
      loyaltyProgram: false,
    },
  },
  {
    tier: 3,
    name: 'Premium',
    price: '$300',
    priceNote: '/month',
    icon: Crown,
    color: '#f59e0b',
    tagline: 'Dominate your state',
    features: {
      clickableProfile: true,
      badge: 'Premium',
      searchBoost: '30 miles',
      shopPhotos: 'Unlimited',
      eventNights: '4',
      specialEvents: '10/year',
      eventPhotos: 'Unlimited',
      rsvpTracking: true,
      analytics: 'Full + Reports',
      notifyFollowers: 'Unlimited',
      stateAlerts: true,
      awardEligible: 'Priority',
      loyaltyProgram: true,
    },
  },
];

const FEATURE_LABELS = {
  clickableProfile: 'Clickable Profile',
  badge: 'Profile Badge',
  searchBoost: 'Search Boost',
  shopPhotos: 'Shop Photos',
  eventNights: 'Weekly Events',
  specialEvents: 'Special Events',
  eventPhotos: 'Event Photos',
  rsvpTracking: 'RSVP Tracking',
  analytics: 'Analytics',
  notifyFollowers: 'Notify Followers',
  stateAlerts: 'State-wide Alerts',
  awardEligible: 'Award Eligibility',
  loyaltyProgram: 'Loyalty Program',
};

const UpgradePlan = () => {
  const navigate = useNavigate();
  const { locationRecord, refreshData } = useLocation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const currentTier = locationRecord?.subscription_tier ?? 0;

  const handleSelectPlan = async (tier) => {
    if (tier === currentTier) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('locations')
        .update({
          subscription_tier: tier,
          subscription_status: tier === 0 ? 'free' : 'active',
        })
        .eq('id', locationRecord.id);

      if (error) throw error;

      await refreshData();
      setMessage(`Switched to ${PLANS.find(p => p.tier === tier)?.name} plan!`);

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error:', err);
      setMessage('Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureValue = (value) => {
    if (value === true) return <Check size={16} color="#22c55e" />;
    if (value === false) return <X size={16} color="#ef4444" />;
    return <span style={styles.featureValue}>{value}</span>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <h1 style={styles.title}>Choose Your Plan</h1>
        <p style={styles.subtitle}>Upgrade to unlock more features and reach more traders</p>

        {/* Message */}
        {message && (
          <div style={styles.message}>{message}</div>
        )}

        {/* Current Plan */}
        <div style={styles.currentPlan}>
          <span style={styles.currentLabel}>Current Plan:</span>
          <span style={{
            ...styles.currentTier,
            color: PLANS.find(p => p.tier === currentTier)?.color || '#6b7280'
          }}>
            {PLANS.find(p => p.tier === currentTier)?.name || 'Free'}
          </span>
        </div>

        {/* Plans Grid */}
        <div style={styles.plansGrid}>
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.tier === currentTier;

            return (
              <div
                key={plan.tier}
                style={{
                  ...styles.planCard,
                  borderColor: isCurrent ? plan.color : plan.recommended ? plan.color : '#2a2a2a',
                  borderWidth: isCurrent || plan.recommended ? '2px' : '1px',
                }}
              >
                {plan.recommended && !isCurrent && (
                  <div style={{ ...styles.recommendedBadge, backgroundColor: plan.color }}>
                    Best Value
                  </div>
                )}
                {isCurrent && (
                  <div style={{ ...styles.currentBadge, backgroundColor: plan.color }}>
                    Current
                  </div>
                )}

                {/* Header */}
                <div style={styles.planHeader}>
                  <div style={{ ...styles.planIcon, backgroundColor: `${plan.color}20`, color: plan.color }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 style={styles.planName}>{plan.name}</h3>
                    <p style={styles.planTagline}>{plan.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div style={styles.priceRow}>
                  <span style={{ ...styles.priceAmount, color: plan.color }}>{plan.price}</span>
                  <span style={styles.priceNote}>{plan.priceNote}</span>
                </div>

                {/* Features */}
                <div style={styles.featuresList}>
                  {Object.entries(plan.features).map(([key, value]) => (
                    <div key={key} style={styles.featureRow}>
                      <span style={styles.featureLabel}>{FEATURE_LABELS[key]}</span>
                      {renderFeatureValue(value)}
                    </div>
                  ))}
                </div>

                {/* Select Button */}
                <button
                  style={{
                    ...styles.selectBtn,
                    backgroundColor: isCurrent ? '#2a2a2a' : plan.color,
                    opacity: loading ? 0.6 : 1,
                  }}
                  onClick={() => handleSelectPlan(plan.tier)}
                  disabled={isCurrent || loading}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div style={styles.comparisonSection}>
          <h2 style={styles.comparisonTitle}>Feature Comparison</h2>

          <div style={styles.comparisonTable}>
            {/* Header Row */}
            <div style={styles.comparisonHeaderRow}>
              <div style={styles.comparisonFeatureCol}>Feature</div>
              {PLANS.map(plan => (
                <div key={plan.tier} style={{
                  ...styles.comparisonPlanCol,
                  color: plan.color
                }}>
                  {plan.name}
                </div>
              ))}
            </div>

            {/* Feature Rows */}
            {Object.keys(FEATURE_LABELS).map(featureKey => (
              <div key={featureKey} style={styles.comparisonRow}>
                <div style={styles.comparisonFeatureCol}>
                  {FEATURE_LABELS[featureKey]}
                </div>
                {PLANS.map(plan => (
                  <div key={plan.tier} style={styles.comparisonPlanCol}>
                    {renderFeatureValue(plan.features[featureKey])}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Dev Note */}
        <div style={styles.devNote}>
          <strong>Dev Mode:</strong> Switching plans directly for testing. Payment integration coming soon.
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
    maxWidth: '1000px',
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
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6a6a6a',
    margin: '0 0 20px 0',
    textAlign: 'center',
  },
  message: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#22c55e',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  currentPlan: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px',
  },
  currentLabel: {
    fontSize: '14px',
    color: '#6a6a6a',
  },
  currentTier: {
    fontSize: '16px',
    fontWeight: '700',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '40px',
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  recommendedBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
  currentBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
  planHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  planIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  planName: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  planTagline: {
    fontSize: '12px',
    color: '#6a6a6a',
    margin: 0,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '16px',
  },
  priceAmount: {
    fontSize: '28px',
    fontWeight: '700',
  },
  priceNote: {
    fontSize: '14px',
    color: '#6a6a6a',
  },
  featuresList: {
    flex: 1,
    marginBottom: '16px',
  },
  featureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #2a2a2a',
  },
  featureLabel: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  featureValue: {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'right',
  },
  selectBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  comparisonSection: {
    marginTop: '20px',
  },
  comparisonTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '16px',
    textAlign: 'center',
  },
  comparisonTable: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  comparisonHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '2fr repeat(4, 1fr)',
    backgroundColor: '#2a2a2a',
    padding: '12px 16px',
    fontWeight: '600',
    fontSize: '13px',
  },
  comparisonRow: {
    display: 'grid',
    gridTemplateColumns: '2fr repeat(4, 1fr)',
    padding: '12px 16px',
    borderBottom: '1px solid #2a2a2a',
    fontSize: '13px',
  },
  comparisonFeatureCol: {
    color: '#94a3b8',
  },
  comparisonPlanCol: {
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devNote: {
    marginTop: '30px',
    padding: '16px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#f59e0b',
    textAlign: 'center',
  },
};

export default UpgradePlan;
