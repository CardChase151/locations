import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Check } from 'lucide-react';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_HOURS = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '12:00', close: '16:00', closed: true },
};

const OperatingHours = () => {
  const navigate = useNavigate();
  const { locationRecord, refreshData } = useLocation();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [hours, setHours] = useState(DEFAULT_HOURS);

  // Load existing hours
  useEffect(() => {
    if (locationRecord?.operating_hours) {
      const existingHours = { ...DEFAULT_HOURS };

      // Parse from "9:00 AM - 5:00 PM" format
      Object.keys(locationRecord.operating_hours).forEach(day => {
        const dayKey = day.toLowerCase();
        const value = locationRecord.operating_hours[day];

        if (existingHours[dayKey]) {
          if (value === 'Closed' || !value) {
            existingHours[dayKey] = { ...existingHours[dayKey], closed: true };
          } else {
            const match = value.match(/(\d{1,2}:\d{2}) (AM|PM) - (\d{1,2}:\d{2}) (AM|PM)/);
            if (match) {
              existingHours[dayKey] = {
                open: convertTo24Hour(match[1], match[2]),
                close: convertTo24Hour(match[3], match[4]),
                closed: false,
              };
            }
          }
        }
      });

      setHours(existingHours);
    }
  }, [locationRecord]);

  const convertTo24Hour = (time, period) => {
    let [h, m] = time.split(':');
    h = parseInt(h);
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return `${h.toString().padStart(2, '0')}:${m}`;
  };

  const convertTo12Hour = (time24) => {
    let [h, m] = time24.split(':');
    h = parseInt(h);
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    return `${h}:${m} ${period}`;
  };

  const handleTimeChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
    setSaved(false);
  };

  const handleClosedToggle = (day) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!locationRecord?.id) return;

    setLoading(true);
    setError('');

    try {
      // Convert to stored format
      const operatingHours = {};
      DAYS.forEach(({ key, label }) => {
        if (hours[key].closed) {
          operatingHours[label] = 'Closed';
        } else {
          const openFormatted = convertTo12Hour(hours[key].open);
          const closeFormatted = convertTo12Hour(hours[key].close);
          operatingHours[label] = `${openFormatted} - ${closeFormatted}`;
        }
      });

      const { error: updateError } = await supabase
        .from('locations')
        .update({
          operating_hours: operatingHours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', locationRecord.id);

      if (updateError) throw updateError;

      setSaved(true);
      await refreshData();

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <h1 style={styles.title}>Operating Hours</h1>
        <p style={styles.subtitle}>Set when your location is open</p>

        {/* Messages */}
        {error && <div style={styles.errorMsg}>{error}</div>}
        {saved && (
          <div style={styles.successMsg}>
            <Check size={16} />
            <span>Saved successfully!</span>
          </div>
        )}

        {/* Hours List */}
        <div style={styles.hoursList}>
          {DAYS.map(({ key, label }) => (
            <div key={key} style={styles.dayRow}>
              <div style={styles.dayLabel}>{label}</div>

              <div style={styles.dayControls}>
                {hours[key].closed ? (
                  <span style={styles.closedText}>Closed</span>
                ) : (
                  <div style={styles.timeInputs}>
                    <input
                      type="time"
                      style={styles.timeInput}
                      value={hours[key].open}
                      onChange={(e) => handleTimeChange(key, 'open', e.target.value)}
                    />
                    <span style={styles.timeSeparator}>to</span>
                    <input
                      type="time"
                      style={styles.timeInput}
                      value={hours[key].close}
                      onChange={(e) => handleTimeChange(key, 'close', e.target.value)}
                    />
                  </div>
                )}

                <button
                  style={{
                    ...styles.closedBtn,
                    backgroundColor: hours[key].closed ? 'rgba(239, 68, 68, 0.15)' : '#2a2a2a',
                    color: hours[key].closed ? '#ef4444' : '#6a6a6a',
                  }}
                  onClick={() => handleClosedToggle(key)}
                >
                  {hours[key].closed ? 'Closed' : 'Open'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            ...styles.saveBtn,
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Hours'}
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
    margin: '0 0 24px 0',
  },
  errorMsg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '20px',
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
    marginBottom: '20px',
  },
  hoursList: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  dayRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #2a2a2a',
  },
  dayLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    minWidth: '100px',
  },
  dayControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timeInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeInput: {
    padding: '8px 10px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    width: '100px',
  },
  timeSeparator: {
    color: '#6a6a6a',
    fontSize: '13px',
  },
  closedText: {
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '80px',
    textAlign: 'center',
  },
  closedBtn: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    minWidth: '70px',
  },
  saveBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#0ea5e9',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
  },
};

export default OperatingHours;
