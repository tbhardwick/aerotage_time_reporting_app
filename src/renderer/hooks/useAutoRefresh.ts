import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  enabled: boolean;
  interval: number; // in milliseconds
  onRefresh: () => Promise<void> | void;
  dependencies?: any[];
}

export const useAutoRefresh = ({
  enabled,
  interval,
  onRefresh,
  dependencies = []
}: UseAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshing = useRef(false);

  const safeRefresh = useCallback(async () => {
    if (isRefreshing.current) return;
    
    isRefreshing.current = true;
    try {
      await onRefresh();
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    } finally {
      isRefreshing.current = false;
    }
  }, [onRefresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(safeRefresh, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, safeRefresh, ...dependencies]);

  // Page visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, triggering refresh...');
        safeRefresh();
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused, triggering refresh...');
      safeRefresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, safeRefresh]);

  return {
    manualRefresh: safeRefresh,
    isRefreshing: isRefreshing.current
  };
}; 