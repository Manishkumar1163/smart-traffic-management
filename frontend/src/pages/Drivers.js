import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

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
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}><Skeleton width={200} /></Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          Registered Drivers Directory
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage registered driver profiles, mapped plates, insurance policies, and violation files
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4, maxWidth: 500 }}>
        <TextField
          label="Search Drivers"
          placeholder="Search by name, license number, plate..."
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

      {drivers.length === 0 ? (
        <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 3, textalign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No driver profiles found in database.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {drivers.map((driver) => (
            <Grid item xs={12} sm={6} md={4} key={driver._id}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent sx={{ p: 3, display: 'flex', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 700, fontSize: 20 }}>
                    {driver.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, noWrap: true }}>
                      {driver.name}
                    </Typography>
                    <Chip
                      label={driver.license_plate}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, mt: 0.5, mb: 1.5, borderRadius: 1.5 }}
                    />
                    
                    <Stack spacing={0.5} sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>
                      <Box sx={{ noWrap: true }}>📧 {driver.email}</Box>
                      <Box>📱 {driver.phone}</Box>
                    </Stack>
                    
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => viewDriverDetails(driver)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      View Dossier
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Driver Dossier Dialog */}
      {selectedDriver && (
        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Driver Dossier: {selectedDriver.name}</span>
            <Button onClick={handleCloseModal} sx={{ fontWeight: 700 }}>Close</Button>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                  License & Registration details
                </Typography>
                
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Owner Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDriver.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Contact Info</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>📧 {selectedDriver.email}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>📱 {selectedDriver.phone}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedDriver.address}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Driving License ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {selectedDriver.license_number}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">RC Certification ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDriver.rc_number}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Insurance number</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDriver.insurance_number}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expires: {new Date(selectedDriver.insurance_expiry).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                  Violation History Log
                </Typography>
                
                {modalLoading ? (
                  <Skeleton variant="rounded" height={250} />
                ) : driverViolations.length === 0 ? (
                  <Box sx={{ p: 4, bgcolor: 'action.hover', borderRadius: 2, textalign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      ✅ No violations recorded on this plate!
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                    {driverViolations.map((v) => (
                      <Card variant="outlined" key={v._id} sx={{ borderRadius: 2, p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {v.violation_type.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Chip
                            label={v.payment_status.toUpperCase()}
                            size="small"
                            color={v.payment_status === 'paid' ? 'success' : 'warning'}
                            sx={{ fontWeight: 700, fontSize: 10 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Date: {new Date(v.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Location: {v.location.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', mt: 0.5 }}>
                          Fine: ₹{v.fine_amount}
                        </Typography>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
