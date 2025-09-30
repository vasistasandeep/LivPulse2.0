import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Dashboard } from '../../types/dashboard';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../services/dashboardApi';

interface DashboardViewerProps {
  dashboardId: number;
}

interface ChartWidget {
  id: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'metric';
  title: string;
  data: any[];
  config: {
    xKey?: string;
    yKeys?: string[];
    colors?: string[];
    height?: number;
    width?: number;
  };
  gridSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
}

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#0088fe', '#00C49F', '#FFBB28', '#FF8042', '#8dd1e1'
];

export const DashboardViewer: React.FC<DashboardViewerProps> = ({ dashboardId }) => {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<ChartWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await dashboardApi.getDashboard(dashboardId);
      setDashboard(dashboardData);
      
      // Parse dashboard config to extract widgets
      if (dashboardData.config && dashboardData.config.widgets) {
        setWidgets(dashboardData.config.widgets);
      }
    } catch (err) {
      setError('Failed to load dashboard. Please try again.');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [dashboardId]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: 'pdf' | 'json') => {
    try {
      const blob = await dashboardApi.exportDashboard(dashboardId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dashboard?.name || 'dashboard'}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const renderChart = (widget: ChartWidget) => {
    const { type, data, config } = widget;
    const height = config.height || 300;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey || 'name'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {config.yKeys?.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey || 'name'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {config.yKeys?.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                  fill={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey || 'name'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {config.yKeys?.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'metric':
        return (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height={height}
          >
            <Typography variant="h2" component="div" color="primary" gutterBottom>
              {data[0]?.value || '0'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {data[0]?.label || 'Metric'}
            </Typography>
            {data[0]?.change && (
              <Chip
                label={`${data[0].change > 0 ? '+' : ''}${data[0].change}%`}
                color={data[0].change > 0 ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        );

      default:
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={height}
          >
            <Typography color="text.secondary">
              Unsupported chart type: {type}
            </Typography>
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dashboard) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error || 'Dashboard not found'}
      </Alert>
    );
  }

  const canEdit = dashboard.createdBy === user?.id || ['Admin', 'TPM'].includes(user?.role || '');

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flexGrow={1}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h4" component="h1">
                {dashboard.name}
              </Typography>
              <Chip
                icon={dashboard.isPublic ? <PublicIcon /> : <PrivateIcon />}
                label={dashboard.isPublic ? 'Public' : 'Private'}
                size="small"
                color={dashboard.isPublic ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>
            
            {dashboard.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {dashboard.description}
              </Typography>
            )}

            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Created by: {dashboard.user?.name || dashboard.user?.email}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date(dashboard.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh data">
              <IconButton onClick={refreshData} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Widgets Grid */}
      {widgets.length > 0 ? (
        <Grid container spacing={3}>
          {widgets.map((widget) => (
            <Grid
              item
              xs={widget.gridSize.xs}
              sm={widget.gridSize.sm}
              md={widget.gridSize.md}
              lg={widget.gridSize.lg}
              key={widget.id}
            >
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={widget.title}
                  action={
                    <Tooltip title="Fullscreen">
                      <IconButton size="small">
                        <FullscreenIcon />
                      </IconButton>
                    </Tooltip>
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  {renderChart(widget)}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No widgets configured
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This dashboard doesn't have any widgets yet.
          </Typography>
        </Paper>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {canEdit && (
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Dashboard
          </MenuItem>
        )}
        
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon sx={{ mr: 1 }} fontSize="small" />
          Share Dashboard
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('pdf')}>
          <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
          Export as PDF
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('json')}>
          <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
          Export as JSON
        </MenuItem>
      </Menu>
    </Box>
  );
};