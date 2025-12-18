import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const LocationContext = createContext({});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [locationRecord, setLocationRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setUserProfile(null);
      setLocationRecord(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, auth_id, email, first_name, last_name, is_location, location_id')
        .eq('auth_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError);
      }

      setUserProfile(userData || null);

      // If user has a location_id, fetch that location record
      if (userData?.location_id) {
        const { data: locData, error: locError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', userData.location_id)
          .single();

        if (locError && locError.code !== 'PGRST116') {
          console.error('Error fetching location:', locError);
        }

        setLocationRecord(locData || null);
      } else {
        setLocationRecord(null);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Status checks
  const needsIntake = !locationRecord; // No location record = needs to submit application
  const isPending = locationRecord && !locationRecord.verified;
  const isApproved = locationRecord?.verified === true;

  // Submit initial application - creates record in locations table
  const submitApplication = async (applicationData) => {
    if (!user?.id) return { error: 'No user' };

    const now = new Date().toISOString();

    // 1. Create location record
    const { data: newLocation, error: locError } = await supabase
      .from('locations')
      .insert({
        store_name: applicationData.businessName,
        phone: applicationData.businessPhone,
        address: applicationData.businessAddress,
        city: applicationData.businessCity,
        state: applicationData.businessState,
        zip_code: applicationData.businessZip,
        website: applicationData.businessWebsite,
        description: applicationData.businessDescription,
        owner_id: user.id,
        verified: false,
        submitted_at: now,
        application_updated_at: now,
        source: 'partner',
        subscription_tier: 1,
        subscription_status: 'pending',
      })
      .select()
      .single();

    if (locError) {
      console.error('Error creating location:', locError);
      return { error: locError };
    }

    // 2. Update user with is_location flag and location_id
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        auth_id: user.id,
        email: user.email,
        is_location: true,
        location_id: newLocation.id,
      }, { onConflict: 'auth_id' });

    if (userError) {
      console.error('Error updating user:', userError);
      return { error: userError };
    }

    await fetchData();
    return { error: null };
  };

  // Update existing application (doesn't change submitted_at)
  const updateApplication = async (applicationData) => {
    if (!locationRecord?.id) return { error: 'No location record' };

    const { error } = await supabase
      .from('locations')
      .update({
        store_name: applicationData.businessName,
        phone: applicationData.businessPhone,
        address: applicationData.businessAddress,
        city: applicationData.businessCity,
        state: applicationData.businessState,
        zip_code: applicationData.businessZip,
        website: applicationData.businessWebsite,
        description: applicationData.businessDescription,
        application_updated_at: new Date().toISOString(),
      })
      .eq('id', locationRecord.id);

    if (!error) {
      await fetchData();
    }

    return { error };
  };

  const value = {
    userProfile,
    locationRecord,
    loading,
    // Status flags
    needsIntake,
    isPending,
    isApproved,
    // Actions
    submitApplication,
    updateApplication,
    refreshData: fetchData,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
