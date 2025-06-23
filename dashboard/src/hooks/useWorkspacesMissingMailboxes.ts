import { useEffect, useState } from 'react';
import type { WorkspaceMissingMailboxes } from '../types/workspaceMissingMailboxes';
import { fetchWorkspacesMissingMailboxes } from '../api/workspaceMissingMailboxes';


export function useWorkspacesMissingMailboxes() {
  const [workspacesWithMissingMailboxes, setworkspacesWithMissingMailboxes] = useState<WorkspaceMissingMailboxes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWorkspacesMissingMailboxes()
      .then(setworkspacesWithMissingMailboxes)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { workspacesWithMissingMailboxes, loading, error };
}
