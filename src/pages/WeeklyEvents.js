import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Plus, Trash2, X, Lock, Calendar } from 'lucide-react';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIER_EVENT_LIMITS = {
  0: 0,  // Free
  1: 2,  // Basic
  2: 2,  // Enhanced
  3: 4,  // Premium
};

const MAX_EVENT_SLOTS = 4;

const EVENT_TYPES = [
  { id: 'trade', label: 'Trade' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'card_show', label: 'Card Show' },
];

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

// Determine Day vs Night based on start time (5PM+ = Night)
const getDayOrNight = (startTime) => {
  if (!startTime) return 'Night';
  const [hours] = startTime.split(':');
  const hour = parseInt(hours);
  return hour >= 17 ? 'Night' : 'Day';
};

// Generate event display name
const generateEventName = (eventType, startTime) => {
  const typeLabel = EVENT_TYPES.find(t => t.id === eventType)?.label || 'Event';
  const dayNight = getDayOrNight(startTime);
  return `${typeLabel} ${dayNight}`;
};

// Generate event subtitle
const generateEventSubtitle = (dayOfWeek, startTime, endTime) => {
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${minutes} ${period}`;
  };
  return `${dayOfWeek}s, ${formatTime(startTime)} - ${formatTime(endTime)}`;
};

const WeeklyEvents = () => {
  const navigate = useNavigate();
  const { locationRecord } = useLocation();

  const [weeklyEvents, setWeeklyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [eventType, setEventType] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');

  // Tier calculations
  const subscriptionTier = locationRecord?.subscription_tier || 0;
  const eventLimit = TIER_EVENT_LIMITS[subscriptionTier] || 0;
  const canAddMore = weeklyEvents.length < eventLimit;
  const activeEvents = weeklyEvents.slice(0, eventLimit);
  const inactiveEvents = weeklyEvents.slice(eventLimit);

  // Fetch weekly events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!locationRecord?.id) return;

      const { data, error } = await supabase
        .from('location_events')
        .select('*')
        .eq('location_id', locationRecord.id)
        .eq('is_recurring', true)
        .order('created_at');

      if (!error && data) {
        setWeeklyEvents(data);
      }
      setLoading(false);
    };
    fetchEvents();
  }, [locationRecord?.id]);

  // Add event
  const handleAddEvent = async () => {
    if (!locationRecord?.id || !eventType || !eventDay || !eventStart || !eventEnd) {
      alert('Please fill in all fields');
      return;
    }

    if (!canAddMore) {
      alert(`You've reached the limit of ${eventLimit} weekly events for your tier.`);
      return;
    }

    setSaving(true);
    try {
      const formatTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
      };

      const startTimeFormatted = formatTime(eventStart);
      const eventName = generateEventName(eventType, startTimeFormatted);

      const { error } = await supabase
        .from('location_events')
        .insert({
          location_id: locationRecord.id,
          name: eventName,
          description: eventType,
          event_date: new Date().toISOString().split('T')[0],
          start_time: startTimeFormatted,
          end_time: formatTime(eventEnd),
          is_recurring: true,
          recurrence_day: eventDay,
        });

      if (error) throw error;

      // Refresh
      const { data } = await supabase
        .from('location_events')
        .select('*')
        .eq('location_id', locationRecord.id)
        .eq('is_recurring', true)
        .order('created_at');

      if (data) setWeeklyEvents(data);

      setShowAddModal(false);
      setEventType('');
      setEventDay('');
      setEventStart('');
      setEventEnd('');
    } catch (err) {
      console.error('Error adding event:', err);
      alert('Failed to add event');
    } finally {
      setSaving(false);
    }
  };

  // Remove event
  const handleRemoveEvent = async (id) => {
    if (!window.confirm('Remove this weekly event?')) return;

    try {
      const { error } = await supabase
        .from('location_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWeeklyEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error removing event:', err);
      alert('Failed to remove event');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <button onClick={() => navigate('/info')} style={styles.backBtn}>
          <ChevronLeft size={20} />
          <span>Back to Settings</span>
        </button>

        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>Weekly Events</h1>
            <p style={styles.subtitle}>
              {Math.min(weeklyEvents.length, eventLimit)} / {eventLimit} active
            </p>
          </div>
          {canAddMore && eventLimit > 0 && (
            <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>Add</span>
            </button>
          )}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <div style={styles.eventSlots}>
            {/* Active Events */}
            {activeEvents.map((event, idx) => (
              <div key={event.id} style={styles.eventSlot}>
                <div style={{ ...styles.slotBadge, backgroundColor: '#22c55e' }}>
                  {idx + 1}
                </div>
                <div style={styles.eventInfo}>
                  <span style={styles.eventName}>{event.name}</span>
                  <span style={styles.eventTime}>
                    {generateEventSubtitle(event.recurrence_day, event.start_time, event.end_time)}
                  </span>
                </div>
                <button style={styles.deleteBtn} onClick={() => handleRemoveEvent(event.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Empty Active Slots */}
            {Array.from({ length: Math.max(0, eventLimit - weeklyEvents.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                style={{ ...styles.eventSlot, ...styles.emptySlot }}
                onClick={() => setShowAddModal(true)}
              >
                <div style={{ ...styles.slotBadge, backgroundColor: '#3a3a3a' }}>
                  {activeEvents.length + idx + 1}
                </div>
                <div style={styles.eventInfo}>
                  <span style={styles.emptyText}>+ Add weekly event</span>
                </div>
              </div>
            ))}

            {/* Inactive Events (over tier limit) */}
            {inactiveEvents.length > 0 && (
              <>
                <div style={styles.separator}>
                  <span style={styles.separatorText}>Not showing on CardChase</span>
                </div>
                {inactiveEvents.map((event, idx) => (
                  <div key={event.id} style={{ ...styles.eventSlot, opacity: 0.5 }}>
                    <div style={{ ...styles.slotBadge, backgroundColor: '#ef4444' }}>
                      {eventLimit + idx + 1}
                    </div>
                    <div style={styles.eventInfo}>
                      <span style={styles.eventName}>{event.name}</span>
                      <span style={styles.eventTime}>
                        {generateEventSubtitle(event.recurrence_day, event.start_time, event.end_time)}
                      </span>
                    </div>
                    <button style={{ ...styles.deleteBtn, opacity: 0.5 }} onClick={() => handleRemoveEvent(event.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Locked Slots */}
            {Array.from({ length: Math.max(0, MAX_EVENT_SLOTS - Math.max(eventLimit, weeklyEvents.length)) }).map((_, idx) => (
              <div key={`locked-${idx}`} style={{ ...styles.eventSlot, opacity: 0.3 }}>
                <div style={{ ...styles.slotBadge, backgroundColor: '#2a2a2a' }}>
                  {Math.max(eventLimit, weeklyEvents.length) + idx + 1}
                </div>
                <div style={styles.eventInfo}>
                  <span style={styles.lockedText}>
                    <Lock size={14} style={{ marginRight: 6 }} />
                    Upgrade to unlock
                  </span>
                </div>
              </div>
            ))}

            {/* No slots message */}
            {eventLimit === 0 && weeklyEvents.length === 0 && (
              <div style={styles.upgradeBox}>
                <Calendar size={32} color="#8b5cf6" />
                <span style={styles.upgradeTitle}>Weekly Events</span>
                <span style={styles.upgradeText}>
                  Upgrade to Basic tier or higher to add weekly events like Trade Nights and Tournament Days.
                </span>
                <button style={styles.upgradeBtn} onClick={() => navigate('/upgrade')}>
                  View Plans
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Weekly Event</h3>
              <button style={styles.modalClose} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.form}>
              {/* Event Type */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Event Type</label>
                <div style={styles.typeGrid}>
                  {EVENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      style={{
                        ...styles.typeBtn,
                        backgroundColor: eventType === type.id ? '#8b5cf6' : '#2a2a2a',
                        borderColor: eventType === type.id ? '#8b5cf6' : '#3a3a3a',
                      }}
                      onClick={() => setEventType(type.id)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Day of Week</label>
                <select
                  style={styles.select}
                  value={eventDay}
                  onChange={(e) => setEventDay(e.target.value)}
                >
                  <option value="">Select a day</option>
                  {DAYS_ORDER.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Start</label>
                  <select
                    style={styles.select}
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                  >
                    <option value="">Start</option>
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>End</label>
                  <select
                    style={styles.select}
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                  >
                    <option value="">End</option>
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {eventType && eventDay && eventStart && eventEnd && (
                <div style={styles.preview}>
                  <span style={styles.previewLabel}>Preview</span>
                  <span style={styles.previewName}>
                    {generateEventName(eventType, eventStart.includes('PM') && parseInt(eventStart) >= 5 ? '17:00:00' : '10:00:00')}
                  </span>
                  <span style={styles.previewTime}>
                    {eventDay}s, {eventStart} - {eventEnd}
                  </span>
                </div>
              )}

              <button
                style={{
                  ...styles.submitBtn,
                  opacity: (!eventType || !eventDay || !eventStart || !eventEnd || saving) ? 0.5 : 1,
                }}
                onClick={handleAddEvent}
                disabled={!eventType || !eventDay || !eventStart || !eventEnd || saving}
              >
                {saving ? 'Adding...' : 'Add Event'}
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#6a6a6a',
  },
  eventSlots: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  eventSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
  },
  emptySlot: {
    borderStyle: 'dashed',
    cursor: 'pointer',
  },
  slotBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  eventName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },
  eventTime: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6a6a6a',
  },
  lockedText: {
    fontSize: '13px',
    color: '#4a4a4a',
    display: 'flex',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: 'none',
    borderRadius: '8px',
    color: '#ef4444',
    cursor: 'pointer',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 0',
  },
  separatorText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  upgradeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    textAlign: 'center',
  },
  upgradeTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
  },
  upgradeText: {
    fontSize: '14px',
    color: '#6a6a6a',
    maxWidth: '280px',
    lineHeight: '1.5',
  },
  upgradeBtn: {
    padding: '12px 24px',
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  // Modal
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
    maxWidth: '400px',
    maxHeight: '90vh',
    overflowY: 'auto',
    zIndex: 1001,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#6a6a6a',
    cursor: 'pointer',
    padding: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#94a3b8',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  typeBtn: {
    padding: '12px 8px',
    border: '1px solid',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
  },
  select: {
    padding: '12px 14px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    width: '100%',
  },
  preview: {
    padding: '14px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  previewLabel: {
    fontSize: '11px',
    color: '#6a6a6a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  previewName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },
  previewTime: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  submitBtn: {
    padding: '14px',
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default WeeklyEvents;
