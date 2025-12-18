import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const LocationContext = createContext({});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [locationProfile, setLocationProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLocationProfile = useCallback(async () => {
    if (!user?.id) {
      setLocationProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          auth_id,
          email,
          first_name,
          last_name,
          is_location,
          location_intake_completed,
          location_approved,
          location_contract_agreed,
          location_contract_agreed_at,
          location_business_name,
          location_business_phone,
          location_business_address,
          location_subscription_tier,
          location_data
        `)
        .eq('auth_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching location profile:', error);
      }

      setLocationProfile(data || null);
    } catch (err) {
      console.error('Error in fetchLocationProfile:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLocationProfile();
  }, [fetchLocationProfile]);

  // Check if user needs to complete intake
  const needsIntake = !locationProfile?.location_intake_completed;

  // Update location profile after intake
  const completeIntake = async (intakeData) => {
    if (!user?.id) return { error: 'No user' };

    const { error } = await supabase
      .from('users')
      .upsert({
        auth_id: user.id,
        email: user.email,
        is_location: true,
        location_intake_completed: true,
        location_business_name: intakeData.businessName,
        location_business_phone: intakeData.businessPhone,
        location_business_address: intakeData.businessAddress,
        location_subscription_tier: 'free',
      }, { onConflict: 'auth_id' });

    if (!error) {
      await fetchLocationProfile();
    }

    return { error };
  };

  const value = {
    locationProfile,
    loading,
    needsIntake,
    completeIntake,
    refreshProfile: fetchLocationProfile,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
