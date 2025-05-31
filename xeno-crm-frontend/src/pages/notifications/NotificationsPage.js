import React, { useState } from 'react';
import { useNotifications, NOTIFICATION_TYPES } from '../../context/NotificationsContext';
import { 
  Box, 
  Typography, 
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  alpha,
  useTheme,
  Menu,
  MenuItem
} from '@mui/material';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CampaignIcon from '@mui/icons-material/Campaign';
import SegmentIcon from '@mui/icons-material/Segment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

const NotificationsPage = () => {
  const theme = useTheme();
  const { 
    notifications, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification, 
    formatRelativeTime 
  } = useNotifications();

  // Filter options
  const [filterType, setFilterType] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  
  // Action menu
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // Handle filter menu
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    handleFilterClose();
  };

  // Handle actions menu
  const handleActionClick = (event, notificationId) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedNotificationId(notificationId);
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
    setSelectedNotificationId(null);
  };

  // Handle read/unread status
  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
    handleActionClose();
  };

  // Handle delete
  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteConfirm = () => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete.id);
    }
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  // Filter notifications based on selected type
  const filteredNotifications = filterType === 'all' 
    ? notifications 
    : notifications.filter(notification => notification.type === filterType);

  // Get the correct icon based on notification type
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

  // Get the color for notification type chip
  const getNotificationTypeColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_CAMPAIGN:
        return 'primary';
      case NOTIFICATION_TYPES.NEW_SEGMENT:
        return 'secondary';
      case NOTIFICATION_TYPES.NEW_CUSTOMERS:
        return 'success';
      case NOTIFICATION_TYPES.CAMPAIGN_PERFORMANCE:
        return 'info';
      case NOTIFICATION_TYPES.SYSTEM:
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get the display name for notification type
  const getNotificationTypeName = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_CAMPAIGN:
        return 'Campaign';
      case NOTIFICATION_TYPES.NEW_SEGMENT:
        return 'Segment';
      case NOTIFICATION_TYPES.NEW_CUSTOMERS:
        return 'Customers';
      case NOTIFICATION_TYPES.CAMPAIGN_PERFORMANCE:
        return 'Performance';
      case NOTIFICATION_TYPES.SYSTEM:
        return 'System';
      default:
        return 'Notification';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 0.5 }}>
            Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stay updated with the latest activities in your CRM
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={markAllAsRead}
            disabled={!notifications.some(n => !n.read)}
            sx={{ borderRadius: 2 }}
          >
            Mark All as Read
          </Button>
          <Button 
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
            sx={{ borderRadius: 2 }}
          >
            Filter
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem onClick={() => handleFilterChange('all')} selected={filterType === 'all'}>
              All Notifications
            </MenuItem>
            <MenuItem onClick={() => handleFilterChange(NOTIFICATION_TYPES.NEW_CAMPAIGN)} selected={filterType === NOTIFICATION_TYPES.NEW_CAMPAIGN}>
              Campaigns
            </MenuItem>
            <MenuItem onClick={() => handleFilterChange(NOTIFICATION_TYPES.NEW_SEGMENT)} selected={filterType === NOTIFICATION_TYPES.NEW_SEGMENT}>
              Segments
            </MenuItem>
            <MenuItem onClick={() => handleFilterChange(NOTIFICATION_TYPES.NEW_CUSTOMERS)} selected={filterType === NOTIFICATION_TYPES.NEW_CUSTOMERS}>
              Customers
            </MenuItem>
            <MenuItem onClick={() => handleFilterChange(NOTIFICATION_TYPES.CAMPAIGN_PERFORMANCE)} selected={filterType === NOTIFICATION_TYPES.CAMPAIGN_PERFORMANCE}>
              Performance
            </MenuItem>
            <MenuItem onClick={() => handleFilterChange(NOTIFICATION_TYPES.SYSTEM)} selected={filterType === NOTIFICATION_TYPES.SYSTEM}>
              System
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Notifications List */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: theme.shadows[3],
      }}>
        <CardContent sx={{ p: 0 }}>
          {filteredNotifications.length > 0 ? (
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      py: 2,
                      px: 3, 
                      bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.light, 0.05),
                      position: 'relative',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.light, 0.1)
                      }
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="more" 
                        onClick={(e) => handleActionClick(e, notification.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main',
                                display: 'inline-block',
                                ml: 1
                              }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" component="span">
                            {notification.details}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip 
                              label={getNotificationTypeName(notification.type)} 
                              size="small" 
                              color={getNotificationTypeColor(notification.type)}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatRelativeTime(notification.date)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, textAlign: 'center' }}>
              <MarkEmailReadIcon sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.2), mb: 2 }} />
              <Typography variant="h6" gutterBottom>No notifications found</Typography>
              <Typography variant="body2" color="text.secondary">
                {filterType === 'all' 
                  ? 'You don\'t have any notifications yet' 
                  : `You don't have any ${getNotificationTypeName(filterType).toLowerCase()} notifications`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem 
          onClick={() => handleMarkAsRead(selectedNotificationId)}
          disabled={!selectedNotificationId || notifications.find(n => n.id === selectedNotificationId)?.read}
        >
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as read</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick(notifications.find(n => n.id === selectedNotificationId))}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete notification</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pt: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Delete Notification
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this notification? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleDeleteCancel} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;
