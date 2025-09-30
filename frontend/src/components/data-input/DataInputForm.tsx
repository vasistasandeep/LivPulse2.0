import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Visibility as PreviewIcon,
  Send as CommitIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface CsvUpload {
  id: string;
  filename: string;
  status: 'uploading' | 'uploaded' | 'previewing' | 'validated' | 'committed' | 'error';
  dataType: string;
  headers: string[];
  rowCount: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    row: number;
    column: string;
    message: string;
  }>;
  preview: Array<Record<string, any>>;
  uploadedAt: string;
}

const DATA_TYPES = [
  { value: 'kpi_metrics', label: 'KPI Metrics' },
  { value: 'content_performance', label: 'Content Performance' },
  { value: 'risks', label: 'Risk Management' },
  { value: 'bugs_sprints', label: 'Bugs & Sprints' },
  { value: 'infra_metrics', label: 'Infrastructure Metrics' },
];

const UPLOAD_STEPS = ['Upload', 'Preview', 'Validate', 'Commit'];

export const DataInputForm: React.FC = () => {
  const [uploads, setUploads] = useState<CsvUpload[]>([]);
  const [currentUpload, setCurrentUpload] = useState<CsvUpload | null>(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [commitDialog, setCommitDialog] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState('');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedDataType) {
      alert('Please select a data type first');
      return;
    }

    for (const file of acceptedFiles) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Only CSV files are supported');
        continue;
      }

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUpload: CsvUpload = {
        id: uploadId,
        filename: file.name,
        status: 'uploading',
        dataType: selectedDataType,
        headers: [],
        rowCount: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [],
        preview: [],
        uploadedAt: new Date().toISOString(),
      };

      setUploads(prev => [...prev, newUpload]);
      setUploading(true);

      try {
        // Simulate file upload and processing
        await simulateFileUpload(file, uploadId);
      } catch (error) {
        updateUploadStatus(uploadId, 'error');
      } finally {
        setUploading(false);
      }
    }
  }, [selectedDataType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const simulateFileUpload = async (file: File, uploadId: string) => {
    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Parse CSV content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    
    // Create preview data
    const preview = lines.slice(1, 6).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, any> = { _rowNumber: index + 2 };
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    // Simulate validation
    const errors: Array<{ row: number; column: string; message: string }> = [];
    const validRows = Math.floor(lines.length * 0.85); // 85% valid rows
    const invalidRows = lines.length - 1 - validRows;

    // Add some sample errors
    if (invalidRows > 0) {
      for (let i = 0; i < Math.min(invalidRows, 3); i++) {
        errors.push({
          row: Math.floor(Math.random() * lines.length) + 2,
          column: headers[Math.floor(Math.random() * headers.length)],
          message: 'Invalid data format',
        });
      }
    }

    setUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? {
            ...upload,
            status: 'validated',
            headers,
            rowCount: lines.length - 1,
            validRows,
            invalidRows,
            errors,
            preview,
          }
        : upload
    ));
  };

  const updateUploadStatus = (uploadId: string, status: CsvUpload['status']) => {
    setUploads(prev => prev.map(upload =>
      upload.id === uploadId ? { ...upload, status } : upload
    ));
  };

  const handlePreview = (upload: CsvUpload) => {
    setCurrentUpload(upload);
    setPreviewDialog(true);
  };

  const handleCommit = (upload: CsvUpload) => {
    setCurrentUpload(upload);
    setCommitDialog(true);
  };

  const confirmCommit = async () => {
    if (!currentUpload) return;

    updateUploadStatus(currentUpload.id, 'committed');
    setCommitDialog(false);
    setCurrentUpload(null);

    // In real implementation, call API to commit data
    console.log('Committing upload:', currentUpload.id);
  };

  const handleDelete = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const downloadTemplate = (dataType: string) => {
    // Generate CSV template based on data type
    const templates: Record<string, string[]> = {
      kpi_metrics: ['metric_name', 'value', 'target', 'period', 'category'],
      content_performance: ['content_title', 'views', 'engagement_rate', 'revenue', 'platform'],
      risks: ['title', 'description', 'severity', 'likelihood', 'category'],
      bugs_sprints: ['title', 'description', 'severity', 'status', 'sprint_name'],
      infra_metrics: ['metric_name', 'value', 'threshold', 'timestamp', 'service'],
    };

    const headers = templates[dataType] || [];
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStepIndex = (status: CsvUpload['status']) => {
    switch (status) {
      case 'uploading':
      case 'uploaded': return 0;
      case 'previewing': return 1;
      case 'validated': return 2;
      case 'committed': return 3;
      default: return 0;
    }
  };

  const getStatusColor = (status: CsvUpload['status']) => {
    switch (status) {
      case 'committed': return 'success';
      case 'error': return 'error';
      case 'validated': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Input
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload and manage your data through CSV files
      </Typography>

      {/* Data Type Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Data Type</InputLabel>
              <Select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                label="Select Data Type"
              >
                {DATA_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => selectedDataType && downloadTemplate(selectedDataType)}
              disabled={!selectedDataType}
              fullWidth
            >
              Download Template
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* File Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop CSV files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to select files
        </Typography>
        <Button variant="contained" disabled={!selectedDataType || uploading}>
          Choose Files
        </Button>
        {!selectedDataType && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please select a data type before uploading files
          </Alert>
        )}
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Processing uploads...
          </Typography>
          <LinearProgress />
        </Paper>
      )}

      {/* Uploads List */}
      {uploads.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Uploads
          </Typography>
          
          {uploads.map((upload) => (
            <Card key={upload.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {upload.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data Type: {DATA_TYPES.find(t => t.value === upload.dataType)?.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {new Date(upload.uploadedAt).toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    <Chip
                      label={upload.status}
                      color={getStatusColor(upload.status)}
                      size="small"
                    />
                    {upload.status === 'validated' && (
                      <>
                        <IconButton size="small" onClick={() => handlePreview(upload)}>
                          <PreviewIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleCommit(upload)}>
                          <CommitIcon />
                        </IconButton>
                      </>
                    )}
                    <IconButton size="small" onClick={() => handleDelete(upload.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Progress Steps */}
                <Stepper activeStep={getStepIndex(upload.status)} alternativeLabel sx={{ mb: 2 }}>
                  {UPLOAD_STEPS.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Upload Stats */}
                {upload.rowCount > 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">
                        Total Rows: {upload.rowCount}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="success.main">
                        Valid: {upload.validRows}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="error.main">
                        Invalid: {upload.invalidRows}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">
                        Columns: {upload.headers.length}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {/* Errors Summary */}
                {upload.errors.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {upload.errors.length} validation error{upload.errors.length !== 1 ? 's' : ''} found.
                      {upload.errors.length <= 3 ? (
                        <List dense>
                          {upload.errors.map((error, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <WarningIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={`Row ${error.row}, Column ${error.column}: ${error.message}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2">
                          Click preview to see all errors.
                        </Typography>
                      )}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </Paper>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Data Preview: {currentUpload?.filename}</DialogTitle>
        <DialogContent>
          {currentUpload && (
            <>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Showing first 5 rows • Total: {currentUpload.rowCount} rows
                </Typography>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      {currentUpload.headers.map((header) => (
                        <TableCell key={header}>{header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentUpload.preview.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row._rowNumber}</TableCell>
                        {currentUpload.headers.map((header) => (
                          <TableCell key={header}>{row[header]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {currentUpload.errors.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Validation Errors
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Column</TableCell>
                          <TableCell>Error</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentUpload.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>{error.column}</TableCell>
                            <TableCell>{error.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          {currentUpload?.status === 'validated' && (
            <Button
              variant="contained"
              onClick={() => {
                setPreviewDialog(false);
                handleCommit(currentUpload);
              }}
            >
              Commit Data
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Commit Confirmation Dialog */}
      <Dialog
        open={commitDialog}
        onClose={() => setCommitDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Commit Data</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to commit this data to the system?
          </Typography>
          {currentUpload && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                File: {currentUpload.filename}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valid rows: {currentUpload.validRows}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invalid rows: {currentUpload.invalidRows} (will be skipped)
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommitDialog(false)}>Cancel</Button>
          <Button onClick={confirmCommit} variant="contained" color="primary">
            Commit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};