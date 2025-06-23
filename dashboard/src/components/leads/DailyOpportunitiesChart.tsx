import React, { useMemo } from 'react';
import { Box, Typography, useTheme, Paper } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Lead {
  date_added: string;
  client: string;
}

interface DailyOpportunitiesChartProps {
  leads: Lead[];
  clientName: string;
  year: number;
  month: number;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export const DailyOpportunitiesChart: React.FC<DailyOpportunitiesChartProps> = ({
  leads,
  clientName,
  year,
  month,
}) => {
  const theme = useTheme();

  // Prepare chart data: count leads per day
  const data = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);

    // Initialize array with days 1..daysInMonth, count 0
    const dayCounts = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      count: 0,
    }));

    leads.forEach((lead) => {
      if (lead.client !== clientName || !lead.date_added) return;
      const date = new Date(lead.date_added);
      if (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month
      ) {
        const day = date.getDate();
        dayCounts[day - 1].count += 1;
      }
    });

    return dayCounts;
  }, [leads, clientName, year, month]);
  const monthAbbr = new Date(year, month - 1).toLocaleString('default', { month: 'short' });

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Daily New Opportunities
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
                dataKey="day"
                ticks={Array.from({ length: Math.ceil(data.length / 5) }, (_, i) => (i + 1) * 5).filter(day => day <= data.length)}
                tickFormatter={(day) => `${monthAbbr} ${day}`}
                label={{ value: 'Day', position: 'insideBottomRight', offset: -5 }}
                tick={{ fill: theme.palette.text.secondary }}
            />
            <YAxis
              allowDecimals={false}
              label={{ value: 'Leads', angle: -90, position: 'insideLeft', offset: 10 }}
              tick={{ fill: theme.palette.text.secondary }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 4 }}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
