import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Paper,
  InputAdornment,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { DashboardCard } from './DashboardCard';
import { Dashboard, DashboardFilters } from '../../types/dashboard';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../services/dashboardApi';

export const DashboardList: React.FC = () => {
  const { user } = useAuthStore();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDashboards: 0,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    dashboard: Dashboard | null;
  }>({
    open: false,
    dashboard: null,
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const fetchDashboards = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardApi.getDashboards({
        page,
        limit: 12,
        ...filters,
      });
      
      setDashboards(response.dashboards);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalDashboards: response.pagination.totalDashboards,
      });
    } catch (err) {
      setError('Failed to fetch dashboards. Please try again.');
      console.error('Error fetching dashboards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, [filters]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: event.target.value,
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    fetchDashboards(value);
  };

  const handleView = (dashboard: Dashboard) => {
    // Navigate to dashboard view
    console.log('View dashboard:', dashboard.id);
  };

  const handleEdit = (dashboard: Dashboard) => {
    // Navigate to dashboard edit
    console.log('Edit dashboard:', dashboard.id);
  };

  const handleDelete = async (dashboard: Dashboard) => {
    setDeleteDialog({ open: true, dashboard });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.dashboard) return;

    try {
      await dashboardApi.deleteDashboard(deleteDialog.dashboard.id);
      setDashboards(prev => 
        prev.filter(d => d.id !== deleteDialog.dashboard!.id)
      );
      setDeleteDialog({ open: false, dashboard: null });
    } catch (err) {
      setError('Failed to delete dashboard. Please try again.');
      console.error('Error deleting dashboard:', err);
    }
  };

  const handleShare = (dashboard: Dashboard) => {
    // Open share dialog
    console.log('Share dashboard:', dashboard.id);
  };

  const handleCreateNew = () => {
    // Navigate to create dashboard
    console.log('Create new dashboard');
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  if (loading && dashboards.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboards
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your data visualization dashboards
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          size="large"
        >
          New Dashboard
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search dashboards..."
              value={filters.search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.isPublic === true}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      isPublic: e.target.checked ? true : undefined,
                    }))}
                  />
                }
                label="Public only"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.createdBy === user?.id}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      createdBy: e.target.checked ? user?.id : undefined,
                    }))}
                  />
                }
                label="My dashboards"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDialogOpen(true)}
              >
                Filters
              </Button>
              {(filters.search || filters.isPublic !== undefined || filters.createdBy !== undefined) && (
                <Button variant="text" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results Summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {pagination.totalDashboards} dashboard{pagination.totalDashboards !== 1 ? 's' : ''} found
        </Typography>
        {loading && (
          <CircularProgress size={20} />
        )}
      </Box>

      {/* Dashboard Grid */}
      {dashboards.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {dashboards.map((dashboard) => (
              <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
                <DashboardCard
                  dashboard={dashboard}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShare={handleShare}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'grey.50',
          }}
        >
          <DashboardIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No dashboards found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {filters.search || filters.isPublic !== undefined || filters.createdBy !== undefined
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by creating your first dashboard.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            Create Dashboard
          </Button>
        </Paper>
      )}

      {/* Floating Action Button for Mobile */}
      <Tooltip title="Create Dashboard">
        <Fab
          color="primary"
          aria-label="create dashboard"
          onClick={handleCreateNew}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' },
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, dashboard: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Dashboard</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.dashboard?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, dashboard: null })}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};