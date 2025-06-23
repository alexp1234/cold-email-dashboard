import {
  Box, Typography, Tooltip, Select, MenuItem,
  FormControl, InputLabel, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, styled, useTheme, CircularProgress
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useClientMetrics } from '../hooks/useClientMetrics';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useWorkspacesMissingMailboxes } from '../hooks/useWorkspacesMissingMailboxes';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const Container = styled(Box)(({ theme }) => ({
  maxWidth: 1200,
  margin: '0 auto',
  padding: '2rem',
  backgroundColor: theme.palette.background.default,
}));

const DashboardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
});

const Card = styled(Paper)(() => ({
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)',
  overflow: 'hidden',
}));

export default function Dashboard() {
  const theme = useTheme();
  const { workspaces, loading: loadingWorkspaces } = useWorkspaces();
  const { workspacesWithMissingMailboxes } = useWorkspacesMissingMailboxes();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedRange, setSelectedRange] = useState<string>('last7');

  const dateRanges = useMemo(() => {
    const today = new Date();
    const format = (d: Date) => d.toISOString().slice(0, 10);

    const subDays = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d;
    };

    const subMonths = (months: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d;
    };

    return {
      daily: {
        last7: {
          label: 'Last 7 Days',
          start: format(subDays(6)),
          end: format(today),
        },
        last30: {
          label: 'Last 30 Days',
          start: format(subDays(29)),
          end: format(today),
        },
      },
      weekly: {
        last4: {
          label: 'Last 4 Weeks',
          start: format(subDays(27)),
          end: format(today),
        },
      },
      monthly: {
        last3: {
          label: 'Last 3 Months',
          start: format(subMonths(3)),
          end: format(today),
        },
        last6: {
          label: 'Last 6 Months',
          start: format(subMonths(6)),
          end: format(today),
        },
      },
    };
  }, []);

  const missingMap = useMemo(() => {
    return Object.fromEntries(
      workspacesWithMissingMailboxes.map(w => [w.workspace_name, w.missing_mailboxes])
    );
  }, [workspacesWithMissingMailboxes]);

  const currentRange = dateRanges[view][selectedRange];
  const { data: clients, loading, error } = useClientMetrics({
    workspaceId: selectedWorkspaceId,
    startDate: currentRange.start,
    endDate: currentRange.end,
  });

  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    if (clients && clients.length > 0) {
      setDates(Object.keys(clients[0].daily_metrics));
    } else {
      setDates([]);
    }
  }, [clients]);

  return (
    <Container>
      <DashboardHeader>
        <Typography variant="h5" fontWeight={700}>
          Lead Management Overview
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>

          <FormControl size="small">
            <InputLabel>View</InputLabel>
            <Select
              value={view}
              label="View"
              onChange={(e) => {
                setView(e.target.value as any);
                setSelectedRange(Object.keys(dateRanges[e.target.value as 'daily'])[0]); // reset range
              }}
            >
              {['daily', 'weekly', 'monthly'].map((v) => (
                <MenuItem key={v} value={v}>
                  {v[0].toUpperCase() + v.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Date Range</InputLabel>
            <Select
              value={selectedRange}
              label="Date Range"
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              {Object.entries(dateRanges[view]).map(([key, range]) => (
                <MenuItem key={key} value={key}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DashboardHeader>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ py: 3 }}>
          {error}
        </Typography>
      ) : clients && clients.length > 0 ? (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 1000 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2}>Client</TableCell>
                  <TableCell rowSpan={2}>Daily Sending Capacity</TableCell>
                  <TableCell rowSpan={2}>Pending Emails</TableCell>
                  <TableCell rowSpan={2}>Runway (Days)</TableCell>
                  <TableCell align="center" colSpan={dates.length}>
                    Emails Sent / Opportunities
                  </TableCell>
                </TableRow>
                <TableRow>
                  {dates.map((date) => (
                    <TableCell key={date}>{date}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.name}>
                    <TableCell>
                      <Typography fontWeight={600}>{client.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.primary.main,
                          backgroundColor: theme.palette.primary.light + '33',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          display: 'inline-block',
                        }}
                      >
                     <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        {client.daily_capacity}
                        {missingMap[client.name]?.length > 0 && (
                        <Tooltip
                          title={
                            <Box sx={{ whiteSpace: 'pre-line' }}>
                              {missingMap[client.name].join('\n')}
                            </Box>
                          }
                          arrow
                        >
                          <WarningAmberIcon fontSize="small" color="warning" />
                        </Tooltip>
                      )}
                      </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{client.pending_emails}</TableCell>
                    <TableCell
                      sx={{
                        color: client.runway_days <= 3 ? theme.palette.error.main : 'inherit',
                        fontWeight: 700,
                      }}
                    >
                      {client.runway_days}
                    </TableCell>
                    {dates.map((d) => (
                      <TableCell key={d}>
                        <Box sx={{ textAlign: 'center' }}>
                          <TableRow>
                            <TableCell>
                              {client.daily_metrics[d]?.emails_sent ?? 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                            {client.daily_metrics[d]?.opportunities ?? 0}
                            </TableCell>
                          </TableRow>         
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      ) : (
        <Typography sx={{ py: 3 }}>No data available for this range.</Typography>
      )}
    </Container>
  );
}