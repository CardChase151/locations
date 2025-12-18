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
          location_request_submitted_at,
          location_request_updated_at,
          location_approved,
          location_approved_at,
          location_rejected,
          location_rejected_at,
          location_rejection_reason,
          location_contract_agreed,
          location_contract_agreed_at,
          location_business_name,
          location_business_phone,
          location_business_address,
          location_business_city,
          location_business_state,
          location_business_zip,
          location_business_website,
          location_business_description,
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

  // Status checks
  const needsIntake = !locationProfile?.location_intake_completed;
  const isPending = locationProfile?.location_intake_completed &&
                    !locationProfile?.location_approved &&
                    !locationProfile?.location_rejected;
  const isApproved = locationProfile?.location_approved === true;
  const isRejected = locationProfile?.location_rejected === true;

  // Submit initial application
  const submitApplication = async (applicationData) => {
    if (!user?.id) return { error: 'No user' };

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('users')
      .upsert({
        auth_id: user.id,
        email: user.email,
        is_location: true,
        location_intake_completed: true,
        location_request_submitted_at: now,
        location_request_updated_at: now,
        location_approved: false,
        location_rejected: false,
        location_business_name: applicationData.businessName,
        location_business_phone: applicationData.businessPhone,
        location_business_address: applicationData.businessAddress,
        location_business_city: applicationData.businessCity,
        location_business_state: applicationData.businessState,
        location_business_zip: applicationData.businessZip,
        location_business_website: applicationData.businessWebsite,
        location_business_description: applicationData.businessDescription,
        location_subscription_tier: 'free',
      }, { onConflict: 'auth_id' });

    if (!error) {
      await fetchLocationProfile();
    }

    return { error };
  };

  // Update existing application (doesn't change submitted_at)
  const updateApplication = async (applicationData) => {
    if (!user?.id) return { error: 'No user' };

    const { error } = await supabase
      .from('users')
      .update({
        location_request_updated_at: new Date().toISOString(),
        location_business_name: applicationData.businessName,
        location_business_phone: applicationData.businessPhone,
        location_business_address: applicationData.businessAddress,
        location_business_city: applicationData.businessCity,
        location_business_state: applicationData.businessState,
        location_business_zip: applicationData.businessZip,
        location_business_website: applicationData.businessWebsite,
        location_business_description: applicationData.businessDescription,
      })
      .eq('auth_id', user.id);

    if (!error) {
      await fetchLocationProfile();
    }

    return { error };
  };

  const value = {
    locationProfile,
    loading,
    // Status flags
    needsIntake,
    isPending,
    isApproved,
    isRejected,
    // Actions
    submitApplication,
    updateApplication,
    refreshProfile: fetchLocationProfile,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
