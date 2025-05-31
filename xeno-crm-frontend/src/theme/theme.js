import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4361ee',
      light: '#6080ff',
      dark: '#2c41bb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7209b7',
      light: '#9a3dd1',
      dark: '#4c0080',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px rgba(0, 0, 0, 0.07)',
    '0px 6px 8px rgba(0, 0, 0, 0.09)',
    '0px 8px 12px rgba(0, 0, 0, 0.1)',
    '0px 10px 14px rgba(0, 0, 0, 0.12)',
    '0px 12px 16px rgba(0, 0, 0, 0.14)',
    '0px 14px 18px rgba(0, 0, 0, 0.16)',
    '0px 16px 20px rgba(0, 0, 0, 0.18)',
    '0px 18px 22px rgba(0, 0, 0, 0.2)',
    '0px 20px 24px rgba(0, 0, 0, 0.22)',
    '0px 22px 26px rgba(0, 0, 0, 0.24)',
    '0px 24px 28px rgba(0, 0, 0, 0.26)',
    '0px 26px 30px rgba(0, 0, 0, 0.28)',
    '0px 28px 32px rgba(0, 0, 0, 0.3)',
    '0px 30px 34px rgba(0, 0, 0, 0.32)',
    '0px 32px 36px rgba(0, 0, 0, 0.34)',
    '0px 34px 38px rgba(0, 0, 0, 0.36)',
    '0px 36px 40px rgba(0, 0, 0, 0.38)',
    '0px 38px 42px rgba(0, 0, 0, 0.4)',
    '0px 40px 44px rgba(0, 0, 0, 0.42)',
    '0px 42px 46px rgba(0, 0, 0, 0.44)',
    '0px 44px 48px rgba(0, 0, 0, 0.46)',
    '0px 46px 50px rgba(0, 0, 0, 0.48)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.12)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontSize: '0.75rem',
          height: '24px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        head: {
          background: '#f8fafc',
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minWidth: 'auto',
        },
      },
    },
  },
});

export default theme;
