import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, UpdateUserPreferencesRequest } from '../types/user-profile-api';
import { profileApi } from '../services/profileApi';

export const useUserPreferences = (userId: string | null) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const preferencesData = await profileApi.getUserPreferences(userId);
      setPreferences(preferencesData);
    } catch (err) {
      console.error('useUserPreferences: Error fetching preferences:', err);
      
      let errorMessage = 'Failed to load preferences';
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('You do not have permission')) {
          errorMessage = 'Permission denied. Please contact your administrator.';
        } else if (err.message.includes('Authentication')) {
          errorMessage = err.message; // Pass through auth errors
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPreferences();
    }
  }, [fetchPreferences, userId]);

  const updatePreferences = async (updates: UpdateUserPreferencesRequest): Promise<UserPreferences> => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    try {
      setUpdating(true);
      setError(null);
      const updatedPreferences = await profileApi.updateUserPreferences(userId, updates);
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const refetch = useCallback(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updating,
    updatePreferences,
    refetch,
  };
}; 