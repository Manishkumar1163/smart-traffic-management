import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';

// Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WarningIcon from '@mui/icons-material/Warning';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';

import api, { API_URL } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, violationsRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/violations')
      ]);
      setStats(statsRes.data);
      setViolations(violationsRes.data.violations || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const getViolationBadgeColor = (type) => {
    switch (type) {
      case 'red_light': return 'error';
      case 'speeding': return 'warning';
      case 'no_helmet': return 'secondary';
      case 'no_seatbelt': return 'info';
      default: return 'primary';
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
          <Skeleton width={200} />
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  // Safe statistics fallbacks
  const statsData = stats || {
    total_violations: 0,
    pending_violations: 0,
    paid_violations: 0,
    today_violations: 0,
    monthly_violations: 0,
    collected_fine: 0,
    pending_fine: 0,
    total_revenue: 0,
    total_drivers: 0,
    total_videos: 0,
    active_cameras: 0,
    vehicle_types: { car: 0, bike: 0, bus: 0, truck: 0, auto: 0, person: 0 }
  };

  const totalVehiclesCount = Object.values(statsData.vehicle_types).reduce((a, b) => a + b, 0);

  const statCards = [
    {
      title: 'TOTAL VEHICLES',
      value: totalVehiclesCount,
      icon: <DirectionsCarIcon fontSize="large" />,
      color: '#6366f1',
      onClick: () => navigate('/drivers')
    },
    {
      title: "TODAY'S VIOLATIONS",
      value: statsData.today_violations,
      icon: <WarningIcon fontSize="large" />,
      color: '#ef4444',
      onClick: () => navigate('/violations')
    },
    {
      title: 'MONTHLY VIOLATIONS',
      value: statsData.monthly_violations,
      icon: <EventNoteIcon fontSize="large" />,
      color: '#f59e0b',
      onClick: () => navigate('/violations')
    },
    {
      title: 'COLLECTED FINE',
      value: `₹${statsData.collected_fine.toLocaleString('en-IN')}`,
      icon: <MonetizationOnIcon fontSize="large" />,
      color: '#10b981',
      onClick: null
    },
    {
      title: 'PENDING FINE',
      value: `₹${statsData.pending_fine.toLocaleString('en-IN')}`,
      icon: <PendingActionsIcon fontSize="large" />,
      color: '#f43f5e',
      onClick: () => navigate('/pending-payments')
    },
    {
      title: 'ACTIVE CAMERAS',
      value: statsData.active_cameras,
      icon: <VideoCameraBackIcon fontSize="large" />,
      color: '#8b5cf6',
      onClick: () => navigate('/live')
    }
  ];

  const payRate = statsData.total_violations > 0
    ? ((statsData.paid_violations / statsData.total_violations) * 100).toFixed(1)
    : '0';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5, color: 'text.primary' }}>
            System Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-Powered Smart Traffic violation analytics and real-time monitoring
          </Typography>
        </Box>
        <Chip label="● AI System Active" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
      </Box>

      {/* Grid of Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card
              onClick={card.onClick ? card.onClick : undefined}
              sx={{
                cursor: card.onClick ? 'pointer' : 'default',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': card.onClick ? {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.15)'
                } : {},
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.8 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: `${card.color}20`,
                      color: card.color,
                      display: 'flex'
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                {card.onClick && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', opacity: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>View details</Typography>
                    <ArrowForwardIcon sx={{ fontSize: 12 }} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Central Layout: Summary Progress Bar & Interactive Table */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* System Overview Card */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  System Health
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Challan Clearance Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{payRate}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={parseFloat(payRate)} color="success" sx={{ height: 8, borderRadius: 2 }} />
                  </Box>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Database</Typography>
                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>ONLINE (MongoDB)</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">AI Detection FPS</Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>30 FPS (YOLOv8)</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">OCR engine</Typography>
                    <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 700 }}>EasyOCR + Tesseract</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={8}>
          {/* Recent Violations Table */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  🚨 Recent Violations
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/violations')}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  View All
                </Button>
              </Box>
              
              {violations.length === 0 ? (
                <Typography variant="body2" sx={{ textalign: 'center', py: 4 }} color="text.secondary">
                  No violations logged yet. Start the live camera stream or upload traffic videos!
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ border: 'none' }}>
                  <Table sx={{ minWidth: 500 }} aria-label="recent violations">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>License Plate</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Violation Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Fine</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {violations.slice(0, 5).map((row) => (
                        <TableRow key={row._id} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {row.license_plate}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.violation_type.replace(/_/g, ' ').toUpperCase()}
                              size="small"
                              color={getViolationBadgeColor(row.violation_type)}
                              variant="soft"
                              sx={{ fontWeight: 700, fontSize: 10 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>₹{row.fine_amount}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.payment_status.toUpperCase()}
                              size="small"
                              variant="outlined"
                              color={row.payment_status === 'paid' ? 'success' : 'warning'}
                              sx={{ fontWeight: 700, fontSize: 10 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}