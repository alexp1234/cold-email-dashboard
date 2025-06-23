import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import { useWorkspaces } from '../hooks/useWorkspaces';
import type { Workspace } from '../types/workspace';
import { useCampaignAnalytics } from '../hooks/useCampaignAnalytics';
import { useLeads } from '../hooks/useLeads';
import { LeadsTable } from '../components/leads/LeadsTable';
import { DailyOpportunitiesChart } from '../components/leads/DailyOpportunitiesChart';
import { CampaignOpportunitiesBarChart } from '../components/leads/CampaignOpportunitiesBarChart';


// Mock data for clients and months
const months = [
  { label: 'June 2025', value: '2025-06' },
  { label: 'May 2025', value: '2025-05' },
  { label: 'April 2025', value: '2025-04' },
];

export default function ClientInsights() {
    const { workspaces, loading: workspacesLoading } = useWorkspaces();
    const {analytics, loading: analyticsLoading, error: analyticsError} = useCampaignAnalytics();
    const { leads, loading: leadsLoading, error: leadsError } = useLeads();
    const [page, setPage] = useState(0);
    const [selectedClient, setSelectedClient] = useState<Workspace | undefined>(undefined);
    const [selectedMonth, setSelectedMonth] = useState(months[0].value);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    useEffect(() => {
        if (!workspacesLoading && workspaces && workspaces.length > 0 && !selectedClient) {
          console.log('setting selected client ', workspaces[0])
          setSelectedClient(workspaces[0]);
        }
      }, [workspacesLoading, workspaces, selectedClient]);


      const [year, month] = selectedMonth.split('-').map(Number);

      const { interestedLeads, emailsSent, activeCampaigns } = useMemo(() => {
        if (!selectedClient || !analytics) return { interestedLeads: 0, emailsSent: 0, activeCampaigns: 0 };
      
        const filtered = analytics.filter(
          (entry) =>
            entry.workspace_id === selectedClient.id &&
            entry.year === year &&
            entry.month === month
        );
      
        return {
          interestedLeads: filtered.reduce((sum, a) => sum + a.total_opportunities, 0),
          emailsSent: filtered.reduce((sum, a) => sum + a.emails_sent, 0),
          activeCampaigns: filtered.length,
        };
      }, [analytics, selectedClient, month, year]);

      const filteredLeads = useMemo(() => {
        if (!selectedClient || !leads) return [];
        
        return leads.filter((lead) => {
          if (!lead.date_added) return false;
          const leadDate = new Date(lead.date_added);
          return (
            lead.client === selectedClient.name &&
            leadDate.getFullYear() === year &&
            leadDate.getMonth() + 1 === month
          );
        });
      }, [leads, selectedClient, year, month]);

      const campaignOpportunitiesData = useMemo(() => {
        if (!selectedClient || !analytics) return [];
      
        // Filter analytics for selected client/month/year
        const filtered = analytics.filter(
          (entry) =>
            entry.workspace_id === selectedClient.id &&
            entry.year === year &&
            entry.month === month
        );
      
        // Map to format required by the chart
        return filtered.map(({ campaign_name, total_opportunities }) => ({
          campaignName: campaign_name,
          totalOpportunities: total_opportunities,
        }));
      }, [analytics, selectedClient, year, month]);

    return (
        <Box>
          {/* Header Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {selectedClient?.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Monthly Lead Generation Report
              </Typography>
            </Box>
    
            <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {months.map((month) => (
                <Chip
                    key={month.value}
                    label={month.label}
                    clickable
                    color={selectedMonth === month.value ? 'primary' : 'default'}
                    variant={selectedMonth === month.value ? 'filled' : 'outlined'}
                    onClick={() => setSelectedMonth(month.value)}
                />
                ))}
            </Box>
    
              {workspaces && <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="client-select-label">Client</InputLabel>
                <Select
                  labelId="client-select-label"
                  value={selectedClient?.id || ''}
                  label="Client"
                  onChange={(e) => setSelectedClient(workspaces.find(w => w.id === e.target.value))}
                >
                  {workspaces.map((ws) => (
                    <MenuItem key={ws.id} value={ws.id}>
                      {ws.name} 
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>}
            </Box>
          </Box>
    
          <Divider sx={{ mb: 3 }} />
    
          {/* Stats Cards */}
          <Grid container spacing={3}>
            {[ 
                { label: 'Interested Leads', value: filteredLeads.length },
                { label: 'Emails Sent', value: emailsSent },
                { label: 'Active Campaigns', value: activeCampaigns }
            ].map((stat) => (
                <Paper sx={{ p: 3, width: '28%' }}>
                    <Box textAlign="center">
                    <Typography variant="h4" color="primary" fontWeight={700}>
                        {stat.value}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        {stat.label}
                    </Typography>
                    </Box>
                </Paper>
            ))}
        </Grid>

        {leadsLoading && <Typography>Loading leads...</Typography>}
        {leadsError && <Typography color="error">Error loading leads</Typography>}
        {!leadsLoading && !leadsError && (
        <Box mt={4}>
            <Typography variant="h6" fontWeight={600} mb={2}>
                Interested Leads This Month
            </Typography>
            <LeadsTable leads={filteredLeads} page={page} onPageChange={handleChangePage} />
        </Box>
        )}
        <Box mt={4}>
            <DailyOpportunitiesChart
                leads={filteredLeads}
                clientName={selectedClient?.name || ''}
                year={year}
                month={month}
            />
        </Box>
        <Box mt={4}>
            <CampaignOpportunitiesBarChart data={campaignOpportunitiesData} />
        </Box>
     </Box>
      );
}
