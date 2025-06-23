import { useEffect, useState } from 'react';
import { fetchCampaignAnalytics } from '../api/campaignAnalytics';
import type { CampaignAnalytics } from '../types/campaignAnalytics';


export function useCampaignAnalytics() {
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchCampaignAnalytics()
      .then(setAnalytics)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { analytics, loading, error };
}
