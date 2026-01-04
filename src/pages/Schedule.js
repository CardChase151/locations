import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft, ChevronRight, X, AlertTriangle,
  Clock, Ban
} from 'lucide-react';

const Schedule = () => {
  const navigate = useNavigate();
  const { locationRecord } = useLocation();

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  // All trades for the location
  const [trades, setTrades] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Block time form
  const [blockForm, setBlockForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    allDay: false,
  });

  // Responsive view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch trades
  useEffect(() => {
    const fetchTrades = async () => {
      if (!locationRecord?.id) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('trade_schedules')
        .select(`
          id,
          selected_date,
          selected_time,
          status,
          trade_requests (
            id,
            requester_id,
            card_owner_id,
            requester:users!trade_requests_requester_id_fkey (
              id,
              username,
              first_name
            ),
            card_owner:users!trade_requests_card_owner_id_fkey (
              id,
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
        .in('status', ['confirmed', 'cancelled']);

      if (!error && data) {
        setTrades(data);
      }
      setLoading(false);
    };
    fetchTrades();
  }, [locationRecord?.id]);

  // Fetch blocked times
  useEffect(() => {
    const fetchBlockedTimes = async () => {
      if (!locationRecord?.id) return;

      const { data } = await supabase
        .from('location_blocked_times')
        .select('*')
        .eq('location_id', locationRecord.id);

      if (data) setBlockedTimes(data);
    };
    fetchBlockedTimes();
  }, [locationRecord?.id]);

  // Week helpers
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDateKey = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDayHeader = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      isToday: formatDateKey(date) === formatDateKey(new Date()),
    };
  };

  const navigateWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  // Group trades by date
  const getTradesForDate = (dateKey) => {
    return trades
      .filter(t => t.selected_date === dateKey && t.status === 'confirmed')
      .sort((a, b) => {
        const timeA = a.selected_time || '00:00';
        const timeB = b.selected_time || '00:00';
        return timeA.localeCompare(timeB);
      });
  };

  // Group trades by time
  const groupTradesByTime = (dayTrades) => {
    const grouped = {};
    dayTrades.forEach(trade => {
      const time = trade.selected_time || 'TBD';
      if (!grouped[time]) grouped[time] = [];
      grouped[time].push(trade);
    });
    return grouped;
  };

  // Cancel trade
  const handleCancelTrade = async () => {
    if (!selectedTrade) return;

    setCancelling(true);
    try {
      // Update trade status
      const { error } = await supabase
        .from('trade_schedules')
        .update({ status: 'cancelled' })
        .eq('id', selectedTrade.id);

      if (error) throw error;

      // Send notifications to both users
      const request = selectedTrade.trade_requests;
      const userIds = [request?.requester?.id, request?.card_owner?.id].filter(Boolean);

      for (const userId of userIds) {
        // Get user's devices
        const { data: devices } = await supabase
          .from('user_devices')
          .select('onesignal_player_id')
          .eq('user_id', userId);

        if (devices?.length > 0) {
          const playerIds = devices.map(d => d.onesignal_player_id).filter(Boolean);
          if (playerIds.length > 0) {
            await fetch('https://onesignal.com/api/v1/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.REACT_APP_ONESIGNAL_REST_API_KEY}`,
              },
              body: JSON.stringify({
                app_id: process.env.REACT_APP_ONESIGNAL_APP_ID,
                include_player_ids: playerIds,
                headings: { en: 'Trade Cancelled' },
                contents: {
                  en: `Your trade at ${locationRecord?.store_name} has been cancelled by the location.`
                },
              }),
            });
          }
        }
      }

      // Refresh trades
      setTrades(prev => prev.map(t =>
        t.id === selectedTrade.id ? { ...t, status: 'cancelled' } : t
      ));

      setShowCancelConfirm(false);
      setSelectedTrade(null);
    } catch (err) {
      console.error('Error cancelling trade:', err);
      alert('Failed to cancel trade');
    } finally {
      setCancelling(false);
    }
  };

  // Block time
  const handleBlockTime = async () => {
    if (!locationRecord?.id) return;
    if (!blockForm.date) {
      alert('Please select a date');
      return;
    }

    try {
      const { error } = await supabase
        .from('location_blocked_times')
        .insert({
          location_id: locationRecord.id,
          date: blockForm.date,
          start_time: blockForm.allDay ? null : blockForm.startTime,
          end_time: blockForm.allDay ? null : blockForm.endTime,
          all_day: blockForm.allDay,
          reason: blockForm.reason,
        });

      if (error) throw error;

      // Check for conflicting trades and cancel them
      const conflictingTrades = trades.filter(t => {
        if (t.status !== 'confirmed') return false;
        const tradeDateKey = t.selected_date;
        const blockDateKey = formatDateKey(new Date(blockForm.date));
        if (tradeDateKey !== blockDateKey) return false;
        if (blockForm.allDay) return true;
        // Time range check would go here
        return true;
      });

      if (conflictingTrades.length > 0) {
        const confirm = window.confirm(
          `There are ${conflictingTrades.length} trades scheduled during this time. Cancel them?`
        );
        if (confirm) {
          for (const trade of conflictingTrades) {
            await supabase
              .from('trade_schedules')
              .update({ status: 'cancelled' })
              .eq('id', trade.id);
          }
          // Refresh
          setTrades(prev => prev.map(t =>
            conflictingTrades.find(ct => ct.id === t.id)
              ? { ...t, status: 'cancelled' }
              : t
          ));
        }
      }

      // Refresh blocked times
      const { data } = await supabase
        .from('location_blocked_times')
        .select('*')
        .eq('location_id', locationRecord.id);
      if (data) setBlockedTimes(data);

      setShowBlockModal(false);
      setBlockForm({ date: '', startTime: '', endTime: '', reason: '', allDay: false });
    } catch (err) {
      console.error('Error blocking time:', err);
      alert('Failed to block time');
    }
  };

  // Check if date is blocked
  const isDateBlocked = (dateKey) => {
    return blockedTimes.some(bt => {
      const btDate = formatDateKey(new Date(bt.date));
      return btDate === dateKey && bt.all_day;
    });
  };

  const weekDays = getWeekDays();
  const weekRange = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  // Render trade card - simple, no image (image shows in detail modal)
  const TradeCard = ({ trade }) => {
    const request = trade.trade_requests;

    return (
      <div
        style={styles.tradeCard}
        onClick={() => setSelectedTrade(trade)}
      >
        <span style={styles.tradeCardUsers}>
          @{request?.requester?.username || 'user'} & @{request?.card_owner?.username || 'user'}
        </span>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>
            <ChevronLeft size={20} />
            <span>Dashboard</span>
          </button>
          <button onClick={() => setShowBlockModal(true)} style={styles.blockBtn}>
            <Ban size={16} />
            <span>Block Time</span>
          </button>
        </div>

        <h1 style={styles.title}>Schedule</h1>

        {/* Week Navigation */}
        <div style={styles.weekNav}>
          <button onClick={() => navigateWeek(-1)} style={styles.navBtn}>
            <ChevronLeft size={20} />
          </button>
          <div style={styles.weekInfo}>
            <span style={styles.weekRange}>{weekRange}</span>
            <button onClick={goToToday} style={styles.todayBtn}>Today</button>
          </div>
          <button onClick={() => navigateWeek(1)} style={styles.navBtn}>
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading schedule...</div>
        ) : isMobile ? (
          /* Mobile: Agenda View */
          <div style={styles.agendaView}>
            {weekDays.map(day => {
              const dateKey = formatDateKey(day);
              const dayInfo = formatDayHeader(day);
              const dayTrades = getTradesForDate(dateKey);
              const blocked = isDateBlocked(dateKey);
              const timeGroups = groupTradesByTime(dayTrades);

              return (
                <div key={dateKey} style={styles.agendaDay}>
                  <div style={{
                    ...styles.agendaDayHeader,
                    ...(dayInfo.isToday ? styles.agendaDayHeaderToday : {}),
                  }}>
                    <span style={styles.agendaDayName}>{dayInfo.day}</span>
                    <span style={{
                      ...styles.agendaDayDate,
                      ...(dayInfo.isToday ? styles.agendaDayDateToday : {}),
                    }}>{dayInfo.date}</span>
                    {blocked && <Ban size={14} color="#ef4444" />}
                  </div>
                  <div style={styles.agendaDayContent}>
                    {blocked ? (
                      <div style={styles.blockedBanner}>Blocked</div>
                    ) : dayTrades.length === 0 ? (
                      <div style={styles.noTrades}>No trades</div>
                    ) : (
                      Object.entries(timeGroups).map(([time, timeTrades]) => (
                        <div key={time} style={styles.timeGroup}>
                          <div style={styles.timeLabel}>{time}</div>
                          <div style={styles.timeTradesList}>
                            {timeTrades.map(trade => (
                              <TradeCard key={trade.id} trade={trade} />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: Week View */
          <div style={styles.weekView}>
            {/* Day Headers */}
            <div style={styles.weekHeader}>
              {weekDays.map(day => {
                const dayInfo = formatDayHeader(day);
                return (
                  <div key={day.toISOString()} style={{
                    ...styles.dayHeader,
                    ...(dayInfo.isToday ? styles.dayHeaderToday : {}),
                  }}>
                    <span style={styles.dayName}>{dayInfo.day}</span>
                    <span style={{
                      ...styles.dayDate,
                      ...(dayInfo.isToday ? styles.dayDateToday : {}),
                    }}>{dayInfo.date}</span>
                  </div>
                );
              })}
            </div>

            {/* Day Columns */}
            <div style={styles.weekGrid}>
              {weekDays.map(day => {
                const dateKey = formatDateKey(day);
                const dayTrades = getTradesForDate(dateKey);
                const blocked = isDateBlocked(dateKey);
                const timeGroups = groupTradesByTime(dayTrades);

                return (
                  <div key={dateKey} style={styles.dayColumn}>
                    {blocked ? (
                      <div style={styles.blockedDay}>
                        <Ban size={16} />
                        <span>Blocked</span>
                      </div>
                    ) : dayTrades.length === 0 ? (
                      <div style={styles.emptyDay}>-</div>
                    ) : (
                      Object.entries(timeGroups).map(([time, timeTrades]) => (
                        <div key={time} style={styles.timeSlot}>
                          <div style={styles.timeSlotHeader}>{time}</div>
                          {timeTrades.map(trade => (
                            <TradeCard key={trade.id} trade={trade} />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && !showCancelConfirm && (
        <>
          <div style={styles.modalOverlay} onClick={() => setSelectedTrade(null)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Trade Details</h3>
              <button style={styles.modalClose} onClick={() => setSelectedTrade(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.tradeDetail}>
              {selectedTrade.trade_requests?.cards && (
                <img
                  src={selectedTrade.trade_requests.cards.digital_image_url || selectedTrade.trade_requests.cards.original_image_url}
                  alt={selectedTrade.trade_requests.cards.name}
                  style={styles.detailImage}
                />
              )}
              <div style={styles.detailInfo}>
                <div style={styles.detailRow}>
                  <Clock size={16} color="#6a6a6a" />
                  <span>{selectedTrade.selected_date} at {selectedTrade.selected_time}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Traders:</span>
                  <span>
                    @{selectedTrade.trade_requests?.requester?.username} & @{selectedTrade.trade_requests?.card_owner?.username}
                  </span>
                </div>
                {selectedTrade.trade_requests?.cards?.name && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Card:</span>
                    <span>{selectedTrade.trade_requests.cards.name}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              style={styles.cancelTradeBtn}
              onClick={() => setShowCancelConfirm(true)}
            >
              <X size={16} />
              <span>Cancel This Trade</span>
            </button>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && selectedTrade && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowCancelConfirm(false)} />
          <div style={styles.modal}>
            <div style={styles.confirmIcon}>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <h3 style={styles.confirmTitle}>Cancel Trade?</h3>
            <p style={styles.confirmText}>
              This will notify both traders that the trade has been cancelled. This cannot be undone.
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.confirmCancelBtn}
                onClick={() => setShowCancelConfirm(false)}
              >
                Go Back
              </button>
              <button
                style={styles.confirmDeleteBtn}
                onClick={handleCancelTrade}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Trade'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Block Time Modal */}
      {showBlockModal && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowBlockModal(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Block Time</h3>
              <button style={styles.modalClose} onClick={() => setShowBlockModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.blockForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Date</label>
                <input
                  type="date"
                  style={styles.formInput}
                  value={blockForm.date}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div style={styles.formCheckbox}>
                <input
                  type="checkbox"
                  id="allDay"
                  checked={blockForm.allDay}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, allDay: e.target.checked }))}
                />
                <label htmlFor="allDay">Block entire day</label>
              </div>

              {!blockForm.allDay && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Start Time</label>
                    <input
                      type="time"
                      style={styles.formInput}
                      value={blockForm.startTime}
                      onChange={(e) => setBlockForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>End Time</label>
                    <input
                      type="time"
                      style={styles.formInput}
                      value={blockForm.endTime}
                      onChange={(e) => setBlockForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Reason (optional)</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="e.g., Holiday, Staff meeting"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <button style={styles.blockSubmitBtn} onClick={handleBlockTime}>
                Block Time
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
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0ea5e9',
    fontSize: '14px',
    cursor: 'pointer',
  },
  blockBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 20px 0',
  },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '12px',
  },
  navBtn: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
  },
  weekInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  weekRange: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  todayBtn: {
    padding: '6px 12px',
    backgroundColor: '#0ea5e9',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#6a6a6a',
  },
  // Desktop Week View
  weekView: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  weekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid #2a2a2a',
  },
  dayHeader: {
    padding: '12px',
    textAlign: 'center',
    borderRight: '1px solid #2a2a2a',
  },
  dayHeaderToday: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  dayName: {
    display: 'block',
    fontSize: '12px',
    color: '#6a6a6a',
    marginBottom: '4px',
  },
  dayDate: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  dayDateToday: {
    color: '#0ea5e9',
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    minHeight: '400px',
  },
  dayColumn: {
    borderRight: '1px solid #2a2a2a',
    padding: '8px',
    minHeight: '300px',
  },
  emptyDay: {
    textAlign: 'center',
    padding: '20px',
    color: '#3a3a3a',
    fontSize: '14px',
  },
  blockedDay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px',
    color: '#ef4444',
    fontSize: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    height: '100%',
  },
  timeSlot: {
    marginBottom: '12px',
  },
  timeSlotHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: '6px',
    padding: '4px 8px',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: '4px',
    display: 'inline-block',
  },
  // Mobile Agenda View
  agendaView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  agendaDay: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  agendaDayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#151515',
    borderBottom: '1px solid #2a2a2a',
  },
  agendaDayHeaderToday: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  agendaDayName: {
    fontSize: '13px',
    color: '#6a6a6a',
  },
  agendaDayDate: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  agendaDayDateToday: {
    color: '#0ea5e9',
  },
  agendaDayContent: {
    padding: '10px 14px',
  },
  noTrades: {
    fontSize: '13px',
    color: '#4a4a4a',
    padding: '8px 0',
  },
  blockedBanner: {
    fontSize: '13px',
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: '8px 12px',
    borderRadius: '6px',
    textAlign: 'center',
  },
  timeGroup: {
    marginBottom: '10px',
  },
  timeLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: '6px',
  },
  timeTradesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  // Trade Cards
  tradeCard: {
    padding: '8px 10px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tradeCardImage: {
    width: '36px',
    height: '50px',
    objectFit: 'cover',
    borderRadius: '4px',
    flexShrink: 0,
  },
  tradeCardInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tradeCardTime: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#8b5cf6',
  },
  tradeCardUsers: {
    fontSize: '12px',
    color: '#ffffff',
  },
  // Modals
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
  // Trade Detail
  tradeDetail: {
    marginBottom: '20px',
  },
  detailImage: {
    width: '100%',
    maxWidth: '150px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#ffffff',
  },
  detailLabel: {
    color: '#6a6a6a',
  },
  detailNotes: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    color: '#94a3b8',
    padding: '10px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    marginTop: '8px',
  },
  cancelTradeBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  // Confirm Modal
  confirmIcon: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  confirmText: {
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: '1.5',
    margin: '0 0 24px 0',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
  },
  confirmCancelBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: 'transparent',
    border: '1px solid #3a3a3a',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  // Block Form
  blockForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#94a3b8',
  },
  formInput: {
    padding: '12px 14px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#ffffff',
  },
  blockSubmitBtn: {
    padding: '14px',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default Schedule;
