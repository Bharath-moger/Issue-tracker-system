'use client';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/services/api';

// Callers provide a stable callback. Ignore responses after unmount or a query change.
export function useResource<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetcher()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetcher, revision]);
  return {
    data,
    setData,
    loading,
    error,
    reload: () => setRevision((value) => value + 1),
  };
}
