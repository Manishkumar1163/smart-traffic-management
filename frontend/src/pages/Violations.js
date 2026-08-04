import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GavelIcon from '@mui/icons-material/Gavel';

import api, { API_URL } from '../services/api';

export default function Violations() {
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modal Preview
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchViolations = async () => {
    try {
      const res = await api.get('/api/violations', {
        params: {
          status: statusFilter,
          type: typeFilter,
          search: search || undefined
        }
      });
      setViolations(res.data.violations || []);
    } catch (err) {
      console.error('Error loading violations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
    // Auto-refresh when search changes or filter changes
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchViolations();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenPreview = (violation) => {
    setSelectedViolation(violation);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedViolation(null);
  };

  const getViolationBadgeColor = (type) => {
    switch (type) {
      case 'red_light': return 'error';
      case 'speeding': return 'warning';
      case 'no_helmet': return 'secondary';
      case 'no_seatbelt': return 'info';
      case 'wrong_lane': return 'error';
      case 'wrong_direction': return 'error';
      case 'illegal_parking': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          Traffic Violations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track, audit, and download PDF challans for AI-logged traffic violations
        </Typography>
      </Box>

      {/* Filters Card */}
      <Card sx={{ borderRadius: 3, mb: 4, backgroundImage: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSearchSubmit}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Search License Plate / Location"
                  placeholder="e.g. MH12AB1234"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit">
                        <SearchIcon />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Violation Type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="all">All Violations</MenuItem>
                  <MenuItem value="red_light">Red Light Violation</MenuItem>
                  <MenuItem value="speeding">Over Speeding</MenuItem>
                  <MenuItem value="no_helmet">No Helmet</MenuItem>
                  <MenuItem value="no_seatbelt">No Seat Belt</MenuItem>
                  <MenuItem value="triple_riding">Triple Riding</MenuItem>
                  <MenuItem value="wrong_lane">Wrong Lane Driving</MenuItem>
                  <MenuItem value="wrong_direction">Wrong Direction Driving</MenuItem>
                  <MenuItem value="illegal_parking">Illegal Parking</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>License Plate</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Registered Driver</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Violation Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fine</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {violations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">No violations match search criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              violations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell>
                      {new Date(row.timestamp).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {row.license_plate}
                    </TableCell>
                    <TableCell>{row.driver_name || 'Unregistered'}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.violation_type.replace(/_/g, ' ').toUpperCase()}
                        size="small"
                        color={getViolationBadgeColor(row.violation_type)}
                        variant="soft"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {row.location}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{row.fine_amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.payment_status.toUpperCase()}
                        size="small"
                        variant="outlined"
                        color={row.payment_status === 'paid' ? 'success' : 'warning'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Evidence Crops">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenPreview(row)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Download Challan PDF">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => window.open(`${API_URL}/api/violations/${row._id}/challan`)}
                          >
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {row.payment_status === 'pending' && (
                          <Tooltip title="Pay Challan">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => navigate(`/pay/${row._id}`)}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={violations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Evidence Dialog Preview */}
      {selectedViolation && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Challan Evidence Review: {selectedViolation.license_plate}</span>
            <Button onClick={handleCloseDialog} sx={{ minWidth: 'auto', fontWeight: 700 }}>Close</Button>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Full Violation Scene Screenshot
                </Typography>
                {selectedViolation.screenshot_path ? (
                  <img
                    src={`${API_URL}/screenshots/${selectedViolation.screenshot_path}`}
                    alt="Violation Scene Evidence"
                    style={{ width: '100%', borderRadius: 8, border: `1px solid ${theme.palette.divider}` }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Box sx={{ p: 4, bgcolor: 'action.hover', borderRadius: 2, textalign: 'center' }}>
                    No context photo available.
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Cropped License Plate
                    </Typography>
                    {selectedViolation.cropped_plate ? (
                      <img
                        src={`${API_URL}/screenshots/cropped_plates/${selectedViolation.cropped_plate}`}
                        alt="Cropped Plate"
                        style={{ height: 70, objectFit: 'contain', borderRadius: 4, border: `2px solid ${theme.palette.primary.main}`, padding: 4 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, textalign: 'center', fontWeight: 600 }}>
                        [ Plate crop not captured ]
                      </Box>
                    )}
                  </Box>

                  <Divider />
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Case ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedViolation._id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Owner / Driver</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedViolation.driver_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Violation Type</Typography>
                    <Chip
                      label={selectedViolation.violation_type.replace(/_/g, ' ').toUpperCase()}
                      size="small"
                      color={getViolationBadgeColor(selectedViolation.violation_type)}
                      sx={{ fontWeight: 700, mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Location & Timestamp</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      📍 {selectedViolation.location.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📅 {new Date(selectedViolation.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Fine Amount</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                      ₹{selectedViolation.fine_amount}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}