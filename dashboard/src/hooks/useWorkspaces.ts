import { useEffect, useState } from 'react';
import type { Workspace } from '../types/workspace';
import { fetchWorkspaces } from '../api/workspaces';


export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWorkspaces()
      .then((allWorkspaces) => {
        // Filter here for only active workspaces
        const activeWorkspaces = allWorkspaces.filter(ws => ws.is_active === true);
        setWorkspaces(activeWorkspaces);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { workspaces, loading, error };
}
