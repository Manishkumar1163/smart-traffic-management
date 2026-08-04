import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
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
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import VideocamIcon from '@mui/icons-material/Videocam';
import MapIcon from '@mui/icons-material/Map';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useAuth } from '../context/AuthContext';
import { ColorModeContext } from '../App';

const drawerWidth = 260;

export default function Layout({ children }) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Analytics', icon: <BarChartIcon />, path: '/charts' },
    { text: 'Live Camera', icon: <VideocamIcon />, path: '/live' },
    { text: 'GIS Map', icon: <MapIcon />, path: '/map' },
    { text: 'Violations', icon: <WarningAmberIcon />, path: '/violations' },
  ];

  const adminItems = [
    { text: 'Upload Video', icon: <CloudUploadIcon />, path: '/upload' },
    { text: 'Processed Videos', icon: <VideoLibraryIcon />, path: '/videos' },
    { text: 'Drivers List', icon: <PeopleIcon />, path: '/drivers' },
    { text: 'Register Driver', icon: <PersonAddIcon />, path: '/register-driver' },
    { text: 'Pending Payments', icon: <ReceiptLongIcon />, path: '/pending-payments' },
  ];

  const renderList = (items) => (
    <List>
      {items.map((item) => {
        const active = location.pathname === item.path;
        return (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1.5,
                my: 0.5,
                borderRadius: 2,
                backgroundColor: active ? theme.palette.primary.main : 'transparent',
                color: active ? '#ffffff' : theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: active ? theme.palette.primary.main : theme.palette.action.hover,
                  color: active ? '#ffffff' : theme.palette.text.primary,
                },
              }}
            >
              <ListItemIcon sx={{ color: active ? '#ffffff' : theme.palette.text.secondary }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: 'background.paper',
          color: 'text.primary',
          backgroundImage: 'none',
          boxShadow: 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 
             adminItems.find(item => item.path === location.pathname)?.text || 'Smart Traffic'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Toggle light/dark theme">
              <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user.role.toUpperCase().replace('_', ' ')}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <Tooltip title="Log out">
              <IconButton onClick={handleLogout} color="error">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 0.8, display: 'flex', color: '#fff' }}>
            <VideocamIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5, color: 'primary.main' }}>
            TRAFFIC AI PORTAL
          </Typography>
        </Box>
        <Divider />
        
        <Box sx={{ py: 1 }}>
          <Typography variant="caption" sx={{ px: 3, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: 10 }}>
            General View
          </Typography>
          {renderList(menuItems)}
        </Box>
        
        {hasRole(['admin', 'traffic_officer']) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ py: 1 }}>
              <Typography variant="caption" sx={{ px: 3, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: 10 }}>
                Operations & Management
              </Typography>
              {renderList(adminItems)}
            </Box>
          </>
        )}
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3.5,
          width: `calc(100% - ${drawerWidth}px)`,
          mt: '64px',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
