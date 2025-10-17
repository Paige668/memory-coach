import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Memory as MemoryIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Today as TodayIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const drawerWidth = 240

const Layout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Memory Management', icon: <MemoryIcon />, path: '/memories' },
    { text: 'Reminders Management', icon: <NotificationsIcon />, path: '/reminders' },
    { text: 'Caregiver Quiz', icon: <TodayIcon />, path: '/quiz', },
    { text: 'Profile', icon: <SettingsIcon />, path: '/profile' },
  ]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleNavigation = (path) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const drawer = (
    <Box sx={{ bgcolor: '#FFFBF7', height: '100%' }}>
      <Toolbar sx={{ py: 2, borderBottom: '2px solid #FFE8D6' }}>
        <Typography 
          variant="h5" 
          noWrap 
          component="div"
          sx={{
            color: '#7B5FA3',  // Warm deep purple
            fontWeight: 700,
            fontSize: '1.5rem',
          }}
        >
          Memory Coach
        </Typography>
      </Toolbar>
      <List sx={{ px: 2, py: 3 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 68,
                borderRadius: '12px',
                px: 2.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #8B6FAC 0%, #A98BBD 100%)',  // Warm medium purple gradient
                  color: '#FFFFFF',  // White text
                  boxShadow: '0 2px 8px rgba(139, 111, 172, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7B5FA3 0%, #9A7DB8 100%)',
                  },
                },
                '&:hover': {
                  backgroundColor: '#FFF5EB',  // Warm light orange background
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path 
                    ? '#FFFFFF'  // White icon
                    : '#666666',
                  minWidth: 44,
                  '& .MuiSvgIcon-root': { fontSize: 32 },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '1.3rem',
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  color: location.pathname === item.path ? '#FFFFFF' : '#2C2C2C',  // White text
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Logout Button */}
        <ListItem disablePadding sx={{ mt: 2 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 68,
              borderRadius: '12px',
              px: 2.5,
              backgroundColor: '#F5F5F5',
              '&:hover': {
                backgroundColor: '#EEEEEE',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: '#666666',
                minWidth: 44,
                '& .MuiSvgIcon-root': { fontSize: 32 },
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Sign Out"
              primaryTypographyProps={{
                fontSize: '1.3rem',
                fontWeight: 500,
                color: '#666666',
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', bgcolor: '#FFF9F0', minHeight: '100vh' }}>
      {/* Top Bar - Simple warm style */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: '#FFFBF7',  // Warm cream yellow
          borderBottom: '2px solid #FFE8D6',  // Warm orange border
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: '#2C2C2C',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h5" 
            noWrap 
            component="div"
            sx={{
              color: '#7B5FA3',  // Warm deep purple
              fontWeight: 700,
              fontSize: '1.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            Memory Coach
          </Typography>
          <Typography
            variant="body2"
            sx={{
              ml: 2,
              color: '#FF9671',  // Warm orange
              fontSize: '0.9rem',
              fontWeight: 500,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Alzheimer's Support
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#FFFBF7',  // Warm cream yellow
              borderRight: '2px solid #FFE8D6',  // Warm orange border
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#FFFBF7',  // Warm cream yellow
              borderRight: '2px solid #FFE8D6',  // Warm orange border
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8, // Account for AppBar height
          bgcolor: '#FFF9F0',  // Warm rice yellow background
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  )
}

export default Layout
