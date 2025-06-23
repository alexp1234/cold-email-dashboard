import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';

import { useLeads } from '../hooks/useLeads';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { LeadsTable } from '../components/leads/LeadsTable';

export default function LeadsPage() {
  const { leads, loading: leadsLoading, error: leadsError } = useLeads();
  const { workspaces, loading: workspacesLoading, error: workspacesError } = useWorkspaces();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!selectedClientId && workspaces && workspaces.length > 0) {
      setSelectedClientId(workspaces[0].id);
    }
  }, [workspaces, selectedClientId]);

  const selectedClient = useMemo(() => {
    return workspaces?.find((ws) => ws.id === selectedClientId);
  }, [workspaces, selectedClientId]);

  const filteredLeads = useMemo(() => {
    if (!selectedClient) return [];
    return leads.filter((lead) => lead.client === selectedClient.name);
  }, [leads, selectedClient]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setPage(0);
  };

  if (leadsLoading || workspacesLoading) return <CircularProgress />;
  if (leadsError || workspacesError)
    return <Typography color="error">Error loading data</Typography>;

  return (
    <Box>
      {/* Header + Client Select */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          All Leads
        </Typography>

        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel id="client-select-label">Client</InputLabel>
          <Select
            labelId="client-select-label"
            value={selectedClientId || ''}
            label="Client"
            onChange={(e) => handleClientChange(e.target.value)}
          >
            {workspaces.map((ws) => (
              <MenuItem key={ws.id} value={ws.id}>
                {ws.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedClient && (
        <>
          <Typography variant="h6" fontWeight={600} mb={1}>
            All Leads for {selectedClient.name}
          </Typography>
          <LeadsTable leads={filteredLeads} page={page} onPageChange={handleChangePage} />
        </>
      )}
    </Box>
  );
}
