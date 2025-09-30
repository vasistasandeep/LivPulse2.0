import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';
import { Dashboard } from '../../types/dashboard';
import { useAuthStore } from '../../store/authStore';

interface DashboardCardProps {
  dashboard: Dashboard;
  onView: (dashboard: Dashboard) => void;
  onEdit: (dashboard: Dashboard) => void;
  onDelete: (dashboard: Dashboard) => void;
  onShare: (dashboard: Dashboard) => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  dashboard,
  onView,
  onEdit,
  onDelete,
  onShare,
}) => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const canEdit = dashboard.createdBy === user?.id || ['Admin', 'TPM'].includes(user?.role || '');
  const canDelete = dashboard.createdBy === user?.id || user?.role === 'Admin';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h2" gutterBottom noWrap>
            {dashboard.name}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ mt: -1, mr: -1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            height: '40px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {dashboard.description || 'No description available'}
        </Typography>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            icon={dashboard.isPublic ? <PublicIcon /> : <PrivateIcon />}
            label={dashboard.isPublic ? 'Public' : 'Private'}
            size="small"
            color={dashboard.isPublic ? 'success' : 'default'}
            variant="outlined"
          />
          {dashboard.tags && dashboard.tags.length > 0 && (
            <Chip
              label={`${dashboard.tags.length} tag${dashboard.tags.length !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Created by: {dashboard.user?.name || dashboard.user?.email || 'Unknown'}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(dashboard.createdAt)}
          </Typography>
          {dashboard.updatedAt !== dashboard.createdAt && (
            <>
              <br />
              <Typography variant="caption" color="text.secondary">
                Updated: {formatDate(dashboard.updatedAt)}
              </Typography>
            </>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          variant="contained"
          startIcon={<ViewIcon />}
          onClick={() => onView(dashboard)}
          size="small"
        >
          View
        </Button>
        
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit(dashboard)}
            size="small"
          >
            Edit
          </Button>
        )}
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { onView(dashboard); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Dashboard</ListItemText>
        </MenuItem>

        {canEdit && (
          <MenuItem onClick={() => { onEdit(dashboard); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Dashboard</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => { onShare(dashboard); handleMenuClose(); }}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share Dashboard</ListItemText>
        </MenuItem>

        {canDelete && (
          <MenuItem
            onClick={() => { onDelete(dashboard); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Dashboard</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};