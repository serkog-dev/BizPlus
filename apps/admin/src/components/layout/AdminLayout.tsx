import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Typography,
  IconButton, Avatar, Menu, MenuItem, Divider,
  useTheme, useMediaQuery, Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  AttachMoney as RevenueIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../api/client'

const DRAWER_WIDTH = 240

const navItems = [
  { label: 'דשבורד', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'עסקים', path: '/tenants', icon: <BusinessIcon /> },
  { label: 'הכנסות', path: '/revenue', icon: <RevenueIcon /> },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const admin = useAuthStore(s => s.admin)
  const logout = useAuthStore(s => s.logout)

  const handleLogout = async () => {
    try { await api.adminLogin('', '') } catch {}
    logout()
    navigate('/login')
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.main' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AdminIcon sx={{ color: 'white', fontSize: 30 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="white" lineHeight={1.2}>
            BizPlus
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            ניהול מערכת
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      <List sx={{ flex: 1, pt: 1.5, px: 1 }}>
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.path)
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false) }}
                sx={{
                  borderRadius: 2,
                  color: active ? 'primary.main' : 'rgba(255,255,255,0.8)',
                  bgcolor: active ? 'white' : 'transparent',
                  '&:hover': { bgcolor: active ? 'white' : 'rgba(255,255,255,0.1)' },
                  '& .MuiListItemIcon-root': {
                    color: active ? 'primary.main' : 'rgba(255,255,255,0.8)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 400 }} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Admin info at bottom */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            {admin?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" color="white" fontWeight={600} lineHeight={1.2}>
              {admin?.firstName} {admin?.lastName}
            </Typography>
            <Chip label="Super Admin" size="small"
              sx={{ height: 16, fontSize: 10, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="fixed" elevation={0} sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        mr: { md: `${DRAWER_WIDTH}px` },
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ ml: 0, mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={e => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13 }}>
              {admin?.firstName?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">{admin?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              יציאה
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          anchor="right" ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" anchor="right" open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' } }}>
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main */}
      <Box component="main" sx={{ flex: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: '100vh', bgcolor: 'grey.100' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
