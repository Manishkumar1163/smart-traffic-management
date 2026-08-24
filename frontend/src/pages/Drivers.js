import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BadgeIcon from '@mui/icons-material/Badge';

import api from '../services/api';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverViolations, setDriverViolations] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/api/drivers', {
        params: { search: search || undefined }
      });
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [search]);

  const viewDriverDetails = async (driver) => {
    setSelectedDriver(driver);
    setOpenModal(true);
    setModalLoading(true);
    try {
      const res = await api.get(`/api/violations/driver/${driver.license_plate}`);
      setDriverViolations(res.data.violations || []);
    } catch (err) {
      console.error('Error fetching driver violations:', err);
      setDriverViolations([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDriver(null);
    setDriverViolations([]);
  };

  if (loading && drivers.length === 0) {
    return (
      <Box className="animate-slide-up">
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}><Skeleton width={220} /></Typography>
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  return (
    <Box className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Driver Database
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Authorized registries, mapped license plates, registration certificate (RC) files, and violation indexes
        </Typography>
      </Box>

      {/* Advanced SaaS Search Filter Card */}
      <Card sx={{ mb: 4, borderRadius: '16px' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ maxWidth: 500 }}>
            <TextField
              label="Search driver name, phone, or license plate"
              placeholder="e.g. Manish Kumar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={fetchDrivers}>
                    <SearchIcon />
                  </IconButton>
                )
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Enterprise Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)', border: 'none', backgroundImage: 'none' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: 'background.paper' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Contact Details</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>License Plate</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>License / RC Numbers</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Database Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, py: 2 }}>Logs</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">No driver records found matching query.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((row) => {
                // Generate a visual avatar background color
                const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
                const colorHash = row.name.charCodeAt(0) % colors.length;
                const avatarBg = colors[colorHash];

                return (
                  <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: avatarBg, fontWeight: 700, width: 40, height: 40 }}>
                          {row.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>ID: {row._id.substring(row._id.length - 8)}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>{row.email}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>📞 {row.phone}</Typography>
                    </TableCell>
                    
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: 13.5 }}>
                      {row.license_plate}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 12.5, fontWeight: 500 }}>DL: {row.license_number}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 11.5 }}>RC: {row.rc_number}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label="ACTIVE"
                        size="small"
                        color="success"
                        variant="soft"
                        sx={{ fontWeight: 800, fontSize: 10 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="View Driver Dossier">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => viewDriverDetails(row)}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detailed Driver Dossier Modal Dialog */}
      {selectedDriver && (
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '16px', bgcolor: 'background.paper', backgroundImage: 'none' }
          }}
        >
          <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon color="primary" />
              Driver Dossier: {selectedDriver.name}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider sx={{ opacity: 0.5 }} />
          
          <DialogContent sx={{ p: 3.5 }}>
            <Grid container spacing={4} sx={{ mb: 4 }}>
              {/* Profile Card */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                  <ContactPhoneIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Contact Info
                </Typography>
                <Card sx={{ bgcolor: 'action.hover', border: 'none' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1}>
                      <Typography variant="body2"><strong>Email:</strong> {selectedDriver.email}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedDriver.phone}</Typography>
                      <Typography variant="body2"><strong>Address:</strong> {selectedDriver.address}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Registration & Insurance Info */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                  <WorkspacePremiumIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Vehicle Certification
                </Typography>
                <Card sx={{ bgcolor: 'action.hover', border: 'none' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1}>
                      <Typography variant="body2"><strong>RC Code:</strong> {selectedDriver.rc_number}</Typography>
                      <Typography variant="body2"><strong>Insurance Policy:</strong> {selectedDriver.insurance_number}</Typography>
                      <Typography variant="body2" color={new Date(selectedDriver.insurance_expiry) < new Date() ? 'error.main' : 'text.primary'}>
                        <strong>Expiry Date:</strong> {new Date(selectedDriver.insurance_expiry).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Past Violations Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
              ⚠️ AI-Logged Traffic Infractions ({driverViolations.length})
            </Typography>

            {modalLoading ? (
              <Skeleton variant="rounded" height={150} sx={{ borderRadius: '12px' }} />
            ) : driverViolations.length === 0 ? (
              <Box sx={{ p: 3.5, bgcolor: 'action.hover', borderRadius: '12px', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No infractions recorded for this driver profile. Good record!</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', backgroundImage: 'none', border: 'none' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Challan ID</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Offense</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Fine</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {driverViolations.map((v) => (
                      <TableRow key={v._id} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>#{v._id.substring(v._id.length - 8)}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{v.violation_type.replace(/_/g, ' ')}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{v.location}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>₹{v.fine_amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={v.payment_status.toUpperCase()}
                            size="small"
                            color={v.payment_status === 'paid' ? 'success' : 'warning'}
                            sx={{ fontWeight: 800, fontSize: 9 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
