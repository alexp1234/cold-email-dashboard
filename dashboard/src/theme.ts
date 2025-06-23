import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#4f46e5', dark: '#3730a3' },
    secondary: { main: '#6366f1' },
    success: { main: '#10b981' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    background: { default: '#f9fafb', paper: '#fff' },
    text: { primary: '#1f2937', secondary: '#4b5563' }
  },
  typography: {
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    fontSize: 14
  }
});

export default theme;
