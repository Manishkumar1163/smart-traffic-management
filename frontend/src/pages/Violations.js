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
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GavelIcon from '@mui/icons-material/Gavel';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import TableSkeleton from '../components/TableSkeleton';
import api, { API_URL } from '../services/api';

export default function Violations() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
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
      setLoading(true);
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

  const handleWaive = async (violationId) => {
    if (window.confirm("Are you sure you want to waive (dismiss) this traffic violation? The fine amount will be reduced to ₹0.")) {
      try {
        await api.put(`/api/violations/${violationId}/waive`);
        alert("Challan successfully waived/dismissed.");
        fetchViolations();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to waive challan.");
      }
    }
  };

  const imageUrl = selectedViolation?.ss 
    ? (selectedViolation.ss.startsWith('http') ? selectedViolation.ss : `${API_URL}/screenshots/${selectedViolation.ss}`)
    : (selectedViolation?.image_url || '');

  const plateCropUrl = selectedViolation?.cropped_plate
    ? (selectedViolation.cropped_plate.startsWith('http') ? selectedViolation.cropped_plate : `${API_URL}/screenshots/cropped_plates/${selectedViolation.cropped_plate}`)
    : (selectedViolation?.plate_crop_url || '');

  return (
    <Box className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Violation Management Portal
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Search, audit evidence crops, process waivers, and download digital challans
        </Typography>
      </Box>

      {/* Modern SaaS Toolbar Filters Card */}
      <Card sx={{ mb: 4, borderRadius: '16px' }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSearchSubmit}>
            <Grid container spacing={2.5} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Search License Plate / Spot"
                  placeholder="e.g. MH12AB1234"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  size="medium"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="submit" size="small">
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Payment Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending Payments</MenuItem>
                  <MenuItem value="paid">Paid / Settled</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Offense Category"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="all">All Violations</MenuItem>
                  <MenuItem value="red_light">Red Light Crossing</MenuItem>
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
                  sx={{ py: 1.6, fontWeight: 700 }}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Enterprise Table Container */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)', border: 'none', backgroundImage: 'none' }}>
        <Table sx={{ minWidth: 800 }} stickyHeader aria-label="violations audit logs">
          <TableHead sx={{ bgcolor: 'background.paper' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>License Plate</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Registered Driver</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Offense Category</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Location Spot</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Fine Amount</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Payment Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, py: 2 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton cols={8} rows={rowsPerPage} />
            ) : violations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">No traffic violation audits found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              violations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontSize: 13 }}>
                      {new Date(row.timestamp).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: 13.5 }}>
                      {row.license_plate}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{row.driver_name || 'Unregistered Owner'}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.violation_type.replace(/_/g, ' ').toUpperCase()}
                        size="small"
                        color={getViolationBadgeColor(row.violation_type)}
                        variant="soft"
                        sx={{ fontWeight: 800, fontSize: 9.5 }}
                      />
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize', fontSize: 13 }}>
                      {row.location}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: 13.5 }}>₹{row.fine_amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.payment_status.toUpperCase()}
                        size="small"
                        variant="outlined"
                        color={row.payment_status === 'paid' ? 'success' : 'warning'}
                        sx={{ 
                          fontWeight: 800, 
                          fontSize: 9.5, 
                          bgcolor: row.payment_status === 'paid' ? 'rgba(34, 197, 94, 0.04)' : 'rgba(245, 158, 11, 0.04)' 
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Evidence Frame">
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
                            onClick={() => window.open(`${API_URL}/api/violations/${row._id}/challan`)}
                          >
                            <PictureAsPdfIcon fontSize="small" sx={{ color: 'error.main' }} />
                          </IconButton>
                        </Tooltip>

                        {row.payment_status === 'pending' && (
                          <Tooltip title="Pay Online">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => navigate(`/pay/${row._id}`)}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {row.payment_status === 'pending' && user && (user.role === 'admin' || user.role === 'traffic_officer') && (
                          <Tooltip title="Waive Challan Fine">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleWaive(row._id)}
                            >
                              <GavelIcon fontSize="small" />
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={violations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </TableContainer>

      {/* High-fidelity Dialog Preview for Evidence Images */}
      {selectedViolation && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '16px', bgcolor: 'background.paper', backgroundImage: 'none' }
          }}
        >
          <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalOfferIcon color="primary" />
              Challan Case Audit: #{selectedViolation._id.substring(selectedViolation._id.length - 8)}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider sx={{ opacity: 0.5 }} />
          
          <DialogContent sx={{ p: 3.5 }}>
            <Grid container spacing={4}>
              {/* Evidence Images */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                  📸 Full Detection Frame Evidence
                </Typography>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Violation Evidence"
                    style={{ width: '100%', borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, display: 'block', maxHeight: 380, objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                    <Typography variant="body2" color="text.secondary">
                      No full frame evidence screenshot captured for this record.
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* metadata and crop details */}
              <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    🔍 Cropped License Plate Plate (EasyOCR Input)
                  </Typography>
                  {plateCropUrl ? (
                    <Box sx={{ mb: 3 }}>
                      <img
                        src={plateCropUrl}
                        alt="Plate Crop"
                        style={{ height: 60, objectFit: 'contain', borderRadius: '8px', border: `2px solid ${theme.palette.primary.main}`, padding: 4, display: 'block', backgroundColor: '#000' }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                      License plate crop not extracted for this violation category.
                    </Typography>
                  )}

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    📝 Violation Summary
                  </Typography>
                  
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Plate Registered</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedViolation.license_plate}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Offense</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>
                        {selectedViolation.violation_type.replace(/_/g, ' ')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Location Spot</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>
                        {selectedViolation.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Fine Amount</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>
                        ₹{selectedViolation.fine_amount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Current Status</Typography>
                      <Chip
                        label={selectedViolation.payment_status.toUpperCase()}
                        size="small"
                        color={selectedViolation.payment_status === 'paid' ? 'success' : 'warning'}
                        sx={{ fontWeight: 800, fontSize: 10 }}
                      />
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="medium"
                    onClick={() => window.open(`${API_URL}/api/violations/${selectedViolation._id}/challan`)}
                    startIcon={<PictureAsPdfIcon />}
                    sx={{ mb: 1.5 }}
                  >
                    Download Audit PDF Challan
                  </Button>
                  
                  {selectedViolation.payment_status === 'pending' && (
                    <Button
                      variant="outlined"
                      color="success"
                      fullWidth
                      size="medium"
                      onClick={() => {
                        handleCloseDialog();
                        navigate(`/pay/${selectedViolation._id}`);
                      }}
                      startIcon={<PaymentIcon />}
                    >
                      Process Payment Settlement
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}