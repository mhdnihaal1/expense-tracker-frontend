import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { onDataChanged } from '@/utils/events';

/**
 * Loads data with a fetcher, refetching when the screen regains focus, when `deps` change,
 * or when any mutation calls emitDataChanged(). While deps change, the previous data stays
 * on screen until the new response arrives (no flashing spinners).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const requestId = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Only touches state after the await, so it is safe to call from effects.
  const fetchData = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const result = await fetcherRef.current();
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, deps);

  const skipFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFirstFocus.current) {
        skipFirstFocus.current = false;
        return;
      }
      fetchData();
    }, [fetchData])
  );

  useEffect(() => onDataChanged(() => { fetchData(); }), [fetchData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    return fetchData();
  }, [fetchData]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchData();
  }, [fetchData]);

  return { data, error, loading, refreshing, refresh, reload: retry, setData };
}
