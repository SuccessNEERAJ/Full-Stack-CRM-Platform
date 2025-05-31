import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Divider, 
  Avatar, 
  Menu, 
  MenuItem,
  Badge,
  Tooltip,
  Button,
  useTheme,
  alpha,
  Chip
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SegmentIcon from '@mui/icons-material/Segment';
import CampaignIcon from '@mui/icons-material/Campaign';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TargetIcon from '@mui/icons-material/LocationOn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import InfoIcon from '@mui/icons-material/Info';

// Router
import { useNavigate, useLocation } from 'react-router-dom';

// Contexts
import { useAuth } from '../../context/AuthContext';
import { useNotifications, NOTIFICATION_TYPES } from '../../context/NotificationsContext';

// Drawer width
const drawerWidth = 240;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    markAsRead, 
    formatRelativeTime 
  } = useNotifications();
  const theme = useTheme();
  
  // State for drawer on mobile
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // State for user menu
  const [anchorEl, setAnchorEl] = useState(null);
  
  // State for notifications menu
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  
  // Toggle drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Open user menu
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Close user menu
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Open notifications menu
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  // Close notifications menu
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  // Navigate to notifications page
  const handleViewAllNotifications = () => {
    handleNotificationsClose();
    navigate('/notifications');
  };
  
  // Mark notification as read when clicked
  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_CAMPAIGN:
        return <CampaignIcon color="primary" />;
      case NOTIFICATION_TYPES.NEW_SEGMENT:
        return <SegmentIcon color="secondary" />;
      case NOTIFICATION_TYPES.NEW_CUSTOMERS:
        return <PeopleAltIcon color="success" />;
      case NOTIFICATION_TYPES.CAMPAIGN_PERFORMANCE:
        return <BarChartIcon color="info" />;
      case NOTIFICATION_TYPES.SYSTEM:
        return <InfoIcon color="warning" />;
      default:
        return <InfoIcon />;
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };
  
  // Navigate to a page and close drawer on mobile
  const navigateTo = (path) => {
    navigate(path);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };
  
  // Navigation items
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
    { text: 'Segments', icon: <SegmentIcon />, path: '/segments' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' }
  ];
  
  // Drawer content
  const drawer = (
    <>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 38, 
              height: 38, 
              borderRadius: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            <TargetIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
            Xeno CRM
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: 'primary.light', 
            color: 'white',
            mb: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Welcome, {user?.displayName || 'User'}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Managing your customers made easy
          </Typography>
        </Box>
      </Box>
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                selected={isActive}
                onClick={() => navigateTo(item.path)}
                sx={{ 
                  borderRadius: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? 'white' : alpha(theme.palette.text.primary, 0.7),
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` },
          boxShadow: `0 2px 10px ${alpha(theme.palette.divider, 0.2)}`,
          bgcolor: 'white',
          color: 'text.primary'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {/* Convert path to title */}
            {location.pathname === '/' ? 'Dashboard' : 
             location.pathname.split('/')[1].charAt(0).toUpperCase() + 
             location.pathname.split('/')[1].slice(1)}
          </Typography>
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Help">
              <IconButton color="inherit" size="small" sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) }
              }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton color="inherit" size="small" sx={{ 
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.15) }
              }}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton
                onClick={handleNotificationsOpen}
                color="inherit"
                sx={{ mx: 1 }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Box sx={{ width: 12 }} />
            
            {/* User menu */}
            <Tooltip title="Account">
              <IconButton 
                onClick={handleUserMenuOpen}
                sx={{ 
                  p: 0.5,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: '50%'
                }}
              >
                {user?.profileImage ? (
                  <Avatar 
                    src={user.profileImage} 
                    alt={user.displayName} 
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <Avatar 
                    alt={user?.displayName || 'User'}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    {user?.displayName?.charAt(0) || 'U'}
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            sx={{ 
              mt: '45px',
              '& .MuiPaper-root': {
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                minWidth: 200
              }
            }}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {user?.displayName || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'admin@example.com'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => {
              handleUserMenuClose();
              navigateTo('/profile');
            }} dense>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose} dense>
              <ListItemIcon>
                <SettingsIcon fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText primary="Account Settings" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} dense>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
          
          {/* Notifications Menu */}
          <Menu
            id="notifications-menu"
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: { 
                width: 320,
                maxHeight: 400,
                overflowY: 'auto',
                borderRadius: 2,
                mt: 1.5,
                boxShadow: theme.shadows[4]
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={500}>Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  {unreadCount > 0 
                    ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}` 
                    : 'No unread messages'}
                </Typography>
              </Box>
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={markAllAsRead}>
                    <CheckCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box>
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <MenuItem 
                    key={notification.id} 
                    sx={{ 
                      py: 1.5,
                      bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.light, 0.05),
                    }}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <Box sx={{ display: 'flex', width: '100%', gap: 1.5 }}>
                      <Box sx={{ mt: 0.5, flexShrink: 0 }}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'} sx={{ mr: 1 }}>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main',
                                display: 'inline-block'
                              }} 
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          {notification.details}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(notification.date)}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No notifications yet
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider />
            <Box sx={{ p: 1.5 }}>
              <Button 
                fullWidth 
                size="small" 
                variant="text"
                onClick={handleViewAllNotifications}
              >
                View All Notifications
              </Button>
            </Box>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Drawer for mobile and desktop */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer (temporary) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer (permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid #E0E0E0'
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
          p: { xs: 2, md: 3 }, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: alpha(theme.palette.primary.light, 0.03),
          backgroundImage: `radial-gradient(${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      >
        <Toolbar /> {/* Spacing to account for AppBar */}
        <Outlet /> {/* Render nested routes */}
      </Box>
    </Box>
  );
};

export default MainLayout;
