import { createTheme } from '@mui/material/styles'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'

export const cacheRtl = createCache({ key: 'muirtl', stylisPlugins: [rtlPlugin] })

export const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Heebo, sans-serif',
  },
  palette: {
    primary: { main: '#1a237e' },   // כחול כהה — מראה ניהולי/רשמי
    secondary: { main: '#283593' },
    background: { default: '#f0f2f5' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid #e0e0e0' } } },
  },
})
