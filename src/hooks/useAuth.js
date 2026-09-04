import { useState, useEffect, useCallback } from 'react';

export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // This hook's entire purpose is to sync `data`/`loading`/`error` with an
  // external system (the API) whenever `apiCall` or the caller-supplied
  // `dependencies` change — that's exactly what an effect is for, and the
  // fetch can't be derived during render. We intentionally suppress
  // set-state-in-effect here rather than restructure the hook away from
  // its purpose.
  //
  // The spread in the dependency array is also intentional: `dependencies`
  // is an arbitrary array supplied by each caller of this hook, so ESLint
  // can't statically verify it. Callers are responsible for passing a
  // stable (e.g. memoized) array.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
};