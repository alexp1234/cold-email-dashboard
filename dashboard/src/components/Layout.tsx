import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
  } from '@mui/material';
  import { Link, Outlet, useLocation } from 'react-router-dom';
  import { useTheme } from '@mui/material/styles';
  
  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Leads', path: '/leads' },
    { label: 'Client Insights', path: '/client-insights' }
  ];
  
  export default function Layout() {
    const location = useLocation();
    const theme = useTheme();
  
    return (
      <Box sx={{ flexGrow: 1, bgcolor: '#f9fafb', minHeight: '100vh' }}>
        <AppBar
          position="fixed"
          elevation={0} // removes bottom border/shadow
          sx={{
            backgroundColor: '#ffffff',  // white navbar background
            color: '#111827',
            borderBottom: 'none'
          }}
        >
          <Toolbar sx={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            {/* Logo text */}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                fontSize: '1.25rem',
                textDecoration: 'none',
                color: theme.palette.primary.main,
              }}
            >
              Cold Email Dashboard
            </Typography>
  
            {/* Nav items */}
            <Box sx={{ display: 'flex', gap: 3 }}>
              {navItems.map(({ label, path }) => (
                <Button
                  key={path}
                  component={Link}
                  to={path}
                  sx={{
                    color:
                      location.pathname === path
                        ? theme.palette.primary.main
                        : '#111827',
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Toolbar>
        </AppBar>
  
        {/* Spacer below AppBar */}
        <Toolbar />
  
        {/* Main content */}
        <Box
          component="main"
          sx={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: 2,
            bgcolor: '#f9fafb',  // light grey main body background
            minHeight: 'calc(100vh - 64px)',  // full viewport height minus navbar height
          }}
        >
          <Outlet />
        </Box>
      </Box>
    );
  }
  