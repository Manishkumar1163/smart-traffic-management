import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import { motion } from 'framer-motion';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { useAuth } from '../context/AuthContext';
import { ColorModeContext } from '../App';

export default function Layout({ children }) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Top Nav Profile Menu State
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const profileMenuOpen = Boolean(profileAnchorEl);

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileMenuAction = (action) => {
    setProfileAnchorEl(null);
    if (action === 'logout') {
      handleLogout();
    } else {
      alert(`Accessing ${action.replace('_', ' ')} panel (demonstration option)`);
    }
  };

  // Fixed Sidebar Width matching the premium dashboard layout
  const sidebarWidth = 260;

  const generalItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Analytics', icon: <BarChartIcon />, path: '/charts' },
    { text: 'Live Camera', icon: <VideocamIcon />, path: '/live' },
    { text: 'GIS Map', icon: <MapIcon />, path: '/map' },
    { text: 'Violations', icon: <WarningAmberIcon />, path: '/violations' },
    { text: 'Challans', icon: <ReceiptLongIcon />, path: '/pending-payments', roles: ['admin', 'traffic_officer'] },
    { text: 'Drivers', icon: <PeopleIcon />, path: '/drivers', roles: ['admin', 'traffic_officer'] },
  ];

  const operationsItems = [
    { text: 'Upload Video', icon: <CloudUploadIcon />, path: '/upload', roles: ['admin', 'traffic_officer'] },
    { text: 'Processed Videos', icon: <VideoLibraryIcon />, path: '/videos', roles: ['admin', 'traffic_officer'] },
    { text: 'Settings', icon: <SettingsIcon />, path: '/register-driver', roles: ['admin', 'traffic_officer'] },
  ];

  const filteredGeneralItems = generalItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const filteredOperationsItems = operationsItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const renderListSection = (items) => (
    <List sx={{ width: '100%', px: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {items.map((item) => {
        const active = location.pathname === item.path;
        return (
          <ListItem key={item.text} disablePadding sx={{ position: 'relative', px: 0.5 }}>
            {active && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: 6, 
                  bottom: 6, 
                  width: 4, 
                  bgcolor: '#a855f7', 
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '0 0 12px #a855f7'
                }} 
              />
            )}
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                px: 2.5,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: active ? '#818cf8' : '#94a3b8',
                bgcolor: active ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                '&:hover': {
                  bgcolor: active ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' }
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: 0, 
                  color: active ? '#818cf8' : 'inherit', 
                  display: 'flex',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: 14, 
                  fontWeight: active ? 700 : 600,
                  transition: 'color 0.2s ease'
                }}
              >
                {item.text}
              </Typography>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  const sidebarContent = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        bgcolor: '#070a13', 
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        py: 2.5
      }}
    >
      {/* Top Logo branding */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          px: 3.5, 
          mb: 4, 
          cursor: 'pointer' 
        }}
        onClick={() => navigate('/dashboard')}
      >
        <Box 
          sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
          }}
        >
          <VideocamIcon fontSize="small" />
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 900, 
            fontSize: 18, 
            letterSpacing: 1.2, 
            background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: '"Outfit", sans-serif'
          }}
        >
          TRAFFIC AI
        </Typography>
      </Box>

      {/* Nav List */}
      <Box sx={{ flexGrow: 1, width: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* General View Section */}
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              px: 3.5, 
              display: 'block', 
              fontWeight: 800, 
              color: '#475569', 
              letterSpacing: 1.2, 
              mb: 1.5, 
              textTransform: 'uppercase',
              fontSize: 10
            }}
          >
            General View
          </Typography>
          {renderListSection(filteredGeneralItems)}
        </Box>

        {filteredOperationsItems.length > 0 && (
          <>
            <Divider sx={{ my: 1.5, mx: 2, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

            {/* Operations Section */}
            <Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 3.5, 
                  display: 'block', 
                  fontWeight: 800, 
                  color: '#475569', 
                  letterSpacing: 1.2, 
                  mb: 1.5, 
                  textTransform: 'uppercase',
                  fontSize: 10
                }}
              >
                Operations
              </Typography>
              {renderListSection(filteredOperationsItems)}
            </Box>
          </>
        )}
      </Box>

      {/* Sidebar Footer Controls with profile */}
      <Box sx={{ width: '100%', px: 2, pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* User Profile dropdown menu block */}
        {user && (
          <Box>
            <Box 
              onClick={handleProfileClick}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                p: 1.5, 
                borderRadius: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                bgcolor: profileMenuOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  width: 36, 
                  height: 36, 
                  fontSize: 14, 
                  fontWeight: 700 
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                  {user.role.toUpperCase().replace('_', ' ')}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon 
                fontSize="small" 
                sx={{ 
                  color: '#64748b',
                  transform: profileMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </Box>

            {/* Profile Drop-down Menu */}
            <Menu
              anchorEl={profileAnchorEl}
              open={profileMenuOpen}
              onClose={handleProfileClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              PaperProps={{
                sx: {
                  mb: 1.5,
                  width: 220,
                  bgcolor: '#0d121f',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                  p: 0.5
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Account Info</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 10 }}>
                  {user.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
              
              <MenuItem onClick={() => handleProfileMenuAction('profile')} sx={{ borderRadius: 1.5, py: 1, fontSize: 13, fontWeight: 600 }}>
                <ListItemIcon sx={{ minWidth: 32 }}><PersonIcon fontSize="small" /></ListItemIcon>
                My Profile
              </MenuItem>
              
              <MenuItem onClick={() => handleProfileMenuAction('settings')} sx={{ borderRadius: 1.5, py: 1, fontSize: 13, fontWeight: 600 }}>
                <ListItemIcon sx={{ minWidth: 32 }}><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>

              <MenuItem onClick={colorMode.toggleColorMode} sx={{ borderRadius: 1.5, py: 1, fontSize: 13, fontWeight: 600 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {theme.palette.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                </ListItemIcon>
                Toggle Theme
              </MenuItem>
              
              <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
              
              <MenuItem 
                onClick={() => handleProfileMenuAction('logout')} 
                sx={{ 
                  borderRadius: 1.5, 
                  py: 1, 
                  fontSize: 13, 
                  fontWeight: 800,
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}><LogoutIcon fontSize="small" /></ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#090d16' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          ml: isMobile ? 0 : `${sidebarWidth}px`,
          bgcolor: '#090d16',
          color: 'text.primary',
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          py: 0.5
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4.5 } }}>
          {/* Left Title block matching reference image */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} color="inherit" edge="start">
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 900, 
                  fontSize: 20, 
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: -0.5,
                  color: '#fff'
                }}
              >
                Operational Command Center
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11.5, display: 'block', mt: 0.25 }}>
                AI-Driven Edge Traffic Management System & Smart e-Challan Logs
              </Typography>
            </Box>
          </Box>

          {/* Right Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5 }}>
            {/* Status Chip */}
            <Chip 
              label="● LIVE COMMAND SYSTEM ONLINE" 
              sx={{ 
                fontWeight: 800, 
                fontSize: 10,
                letterSpacing: 0.8,
                color: '#22c55e',
                borderColor: 'rgba(34, 197, 94, 0.25)',
                bgcolor: 'rgba(34, 197, 94, 0.05)',
                border: '1px solid',
                '& .MuiChip-label': { px: 1.5 }
              }} 
            />

            {/* Notification Bell */}
            <Tooltip title="View notifications">
              <IconButton 
                sx={{ 
                  color: '#94a3b8', 
                  bgcolor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' }
                }}
              >
                <Badge badgeContent={3} color="primary">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer menus */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box',
              bgcolor: '#070a13',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box',
              bgcolor: '#070a13',
              borderRight: 'none'
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}
      
      {/* Main Content Pane */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4 }, // 16px mobile, 24px tablet, 32px desktop
          mt: '76px', // Matches the updated py height of navbar
          bgcolor: '#090d16',
        }}
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </Box>
    </Box>
  );
}
