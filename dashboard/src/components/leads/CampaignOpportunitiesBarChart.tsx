import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
  } from 'recharts';
  import { Box, Typography, useTheme, Stack } from '@mui/material';
  
  interface CampaignOpportunitiesBarChartProps {
    data: { campaignName: string; totalOpportunities: number }[];
  }
  
  const COLORS = [
    '#4f46e5',
    '#6366f1',
    '#3730a3',
    '#7b1fa2',
    '#d32f2f',
    '#0288d1',
    '#c2185b',
  ];
  
  export function CampaignOpportunitiesBarChart({
    data,
  }: CampaignOpportunitiesBarChartProps) {
    const theme = useTheme();
  
    // Only campaigns with >0 opportunities
    const filteredData = data.filter((d) => d.totalOpportunities > 0);
  
    return (
      <Box mt={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          New Opportunities by Campaign
        </Typography>
  
        <Box sx={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              {/* Hide the labels under bars by rendering empty ticks */}
              <XAxis
                dataKey="campaignName"
                tick={() => null} // hides ticks/labels under bars
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: theme.palette.text.secondary }}
                allowDecimals={false}
              />
              <Tooltip />
              <Bar dataKey="totalOpportunities" barSize={60}>
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
  
        {/* Legend below the chart */}
        <Box mt={3}>
          <Stack direction="row" flexWrap="wrap" gap={2} justifyContent="center">
            {filteredData.map((entry, index) => (
              <Box
                key={entry.campaignName}
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ minWidth: 'fit-content' }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: COLORS[index % COLORS.length],
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {entry.campaignName} ({entry.totalOpportunities})
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    );
  }
  