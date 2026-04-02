import { useState, useEffect, useCallback } from "react";

/**
 * useApi — generic hook for API calls with loading, error, and data state
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => restaurantAPI.getAll());
 */
const useApi = (apiFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

export default useApi;
