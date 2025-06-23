import { useEffect, useState } from 'react';
import { fetchLeads } from '../api/leads';
import type { Lead } from '../types/leads';


export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchLeads()
      .then(setLeads)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { leads, loading, error };
}
