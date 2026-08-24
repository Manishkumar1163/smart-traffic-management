import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Pagination from '@mui/material/Pagination';

// Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WarningIcon from '@mui/icons-material/Warning';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';

import api, { API_URL } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressValue, setProgressValue] = useState(0);

  // Pagination for the table
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

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
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stats) {
      const rate = stats.total_violations > 0
        ? parseFloat(((stats.paid_violations / stats.total_violations) * 100).toFixed(1))
        : 0;
      const timer = setTimeout(() => {
        setProgressValue(rate);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [stats]);

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
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }} className="animate-slide-up">
        {/* KPI Cards Grid Skeleton */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              '@media (min-width: 1024px)': {
                gridTemplateColumns: 'repeat(2, 1fr)',
              },
              '@media (min-width: 1366px)': {
                gridTemplateColumns: 'repeat(3, 1fr)',
              }
            },
            gap: '24px',
            width: '100%',
            mb: '24px'
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.02)' }} />
          ))}
        </Box>

        {/* System Health Telemetry Skeleton */}
        <Skeleton variant="rounded" height={105} sx={{ borderRadius: '16px', mb: '24px', bgcolor: 'rgba(255, 255, 255, 0.02)', width: '100%' }} />

        {/* Recent System Violations Skeleton */}
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: '16px', mb: '24px', bgcolor: 'rgba(255, 255, 255, 0.02)', width: '100%' }} />
      </Box>
    );
  }

  const statsData = stats || {
    total_violations: 0,
    pending_violations: 0,
    paid_violations: 0,
    today_violations: 0,
    monthly_violations: 0,
    collected_fine: 0,
    pending_fine: 0,
    total_drivers: 0,
    active_cameras: 0,
    vehicle_types: { car: 0, bike: 0, bus: 0, truck: 0, auto: 0, person: 0 }
  };

  const totalVehiclesCount = Object.values(statsData.vehicle_types).reduce((a, b) => a + b, 0);

  const renderSparkline = (color, points = "M0 18 Q 10 5, 20 15 T 40 4 T 60 12") => (
    <svg width="60" height="24" viewBox="0 0 60 24" style={{ opacity: 0.85 }}>
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  const statCards = [
    {
      title: 'TOTAL VEHICLES',
      value: totalVehiclesCount.toLocaleString(),
      desc: 'Active tracked vehicles',
      trend: '+5.4%',
      trendColor: '#22c55e',
      sparkline: renderSparkline('#6366f1', "M0 18 Q 10 6, 20 16 T 40 5 T 60 11"),
      icon: <DirectionsCarIcon sx={{ fontSize: 20 }} />,
      color: '#6366f1',
      onClick: () => navigate('/drivers')
    },
    {
      title: "TODAY'S VIOLATIONS",
      value: statsData.today_violations,
      desc: 'Violations logged today',
      trend: '+12.1%',
      trendColor: '#ef4444',
      sparkline: renderSparkline('#ef4444', "M0 10 Q 15 22, 30 8 T 60 19"),
      icon: <WarningIcon sx={{ fontSize: 20 }} />,
      color: '#ef4444',
      onClick: () => navigate('/violations')
    },
    {
      title: 'MONTHLY VIOLATIONS',
      value: statsData.monthly_violations,
      desc: 'Total violations this month',
      trend: '-2.4%',
      trendColor: '#22c55e',
      sparkline: renderSparkline('#f59e0b', "M0 15 Q 15 5, 30 18 T 60 4"),
      icon: <EventNoteIcon sx={{ fontSize: 20 }} />,
      color: '#f59e0b',
      onClick: () => navigate('/violations')
    },
    {
      title: 'COLLECTED FINES',
      value: `₹${statsData.collected_fine.toLocaleString('en-IN')}`,
      desc: 'Settled challan revenue',
      trend: '+8.2%',
      trendColor: '#22c55e',
      sparkline: renderSparkline('#22c55e', "M0 20 Q 15 8, 30 12 T 60 2"),
      icon: <MonetizationOnIcon sx={{ fontSize: 20 }} />,
      color: '#22c55e',
      onClick: null
    },
    {
      title: 'PENDING FINES',
      value: `₹${statsData.pending_fine.toLocaleString('en-IN')}`,
      desc: 'Outstanding active challans',
      trend: '+14.6%',
      trendColor: '#ef4444',
      sparkline: renderSparkline('#fb7185', "M0 8 Q 15 18, 30 6 T 60 22"),
      icon: <PendingActionsIcon sx={{ fontSize: 20 }} />,
      color: '#fb7185',
      onClick: () => navigate('/pending-payments')
    },
    {
      title: 'ACTIVE CAMERAS',
      value: statsData.active_cameras,
      desc: 'Junction camera nodes online',
      trend: 'Static',
      trendColor: '#94a3b8',
      sparkline: renderSparkline('#a855f7', "M0 12 H 15 V 6 H 30 V 18 H 45 V 12 H 60"),
      icon: <VideoCameraBackIcon sx={{ fontSize: 20 }} />,
      color: '#a855f7',
      onClick: () => navigate('/live')
    }
  ];

  const payRate = statsData.total_violations > 0
    ? ((statsData.paid_violations / statsData.total_violations) * 100).toFixed(1)
    : '0';

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }} className="animate-slide-up">
      {/* Grid of Metric Cards (Row 1: Indexes 0,1,2 | Row 2: Indexes 3,4,5) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            '@media (min-width: 1024px)': {
              gridTemplateColumns: 'repeat(2, 1fr)',
            },
            '@media (min-width: 1366px)': {
              gridTemplateColumns: 'repeat(3, 1fr)',
            }
          },
          gap: '24px',
          width: '100%',
          mb: '24px'
        }}
      >
        {statCards.map((card, idx) => (
          <Card
            key={idx}
            onClick={card.onClick ? card.onClick : undefined}
            className={card.onClick ? "stat-card-glow" : ""}
            sx={{
              cursor: card.onClick ? 'pointer' : 'default',
              borderRadius: '16px',
              bgcolor: '#0d121f',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backgroundImage: 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 3
            }}
          >
            {/* Top Row: Icon on left, Title + Value on right */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  bgcolor: `${card.color}12`,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 16px ${card.color}20`
                }}
              >
                {card.icon}
              </Box>
              <Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8', 
                    fontWeight: 800, 
                    letterSpacing: 0.8, 
                    fontSize: 10,
                    textTransform: 'uppercase'
                  }}
                >
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.25, color: '#fff', letterSpacing: -0.5 }}>
                  {card.value}
                </Typography>
              </Box>
            </Box>

            {/* Bottom Row: Description + Trend, Sparkline on far right */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: 11, mb: 0.25 }}>
                  {card.desc}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: card.trendColor, fontSize: 11 }}>
                    {card.trend}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: 11 }}>
                    {card.trend !== 'Static' ? 'last week' : ''}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ pr: 0.5, pb: 0.25 }}>
                {card.sparkline}
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* System Health Telemetry (Full Width) */}
      <Card
        sx={{
          width: '100%',
          mb: '24px',
          borderRadius: '16px',
          bgcolor: '#0d121f',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundImage: 'none'
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: '#fff', fontSize: 16 }}>
            System Health Telemetry
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-end' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#94a3b8' }}>
              Challan Settlement Rate
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#22c55e' }}>
              {payRate}%
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            sx={{ 
              height: 10, 
              borderRadius: 5, 
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }
            }} 
          />
        </CardContent>
      </Card>

      {/* Recent System Violations (Full Width) */}
      <Card
        sx={{
          width: '100%',
          mb: '24px',
          borderRadius: '16px',
          bgcolor: '#0d121f',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundImage: 'none'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ color: '#ef4444' }}>⚠️</Box>
              Recent System Violations
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/violations')}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 700, 
                color: '#818cf8',
                fontSize: 13,
                '&:hover': { bgcolor: 'transparent', color: '#6366f1' }
              }}
            >
              View All Logbook →
            </Button>
          </Box>
          
          {violations.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No violations logged. Run the AI simulation or upload traffic video files.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 500 }} size="medium">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#64748b', fontWeight: 700, fontSize: 12 } }}>
                    <TableCell>License Plate</TableCell>
                    <TableCell>Offense Category</TableCell>
                    <TableCell>Fine Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {violations
                    .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                    .map((row) => (
                      <TableRow key={row._id} hover sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.02)', py: 2 } }}>
                        <TableCell 
                          sx={{ 
                            fontWeight: 800, 
                            color: '#818cf8', 
                            fontSize: 13.5,
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate('/violations')}
                        >
                          {row.license_plate}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.violation_type.replace(/_/g, ' ').toUpperCase()}
                            size="small"
                            color={getViolationBadgeColor(row.violation_type)}
                            variant="soft"
                            sx={{ fontWeight: 800, fontSize: 9.5, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#fff' }}>₹{row.fine_amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.payment_status.toUpperCase()}
                            size="small"
                            variant="outlined"
                            color={row.payment_status === 'paid' ? 'success' : 'warning'}
                            sx={{ 
                              fontWeight: 800, 
                              fontSize: 9.5,
                              bgcolor: 'transparent',
                              borderColor: row.payment_status === 'paid' ? 'success.main' : 'warning.main',
                              color: row.payment_status === 'paid' ? 'success.main' : 'warning.main'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Tooltip title="Download Challan PDF">
                              <IconButton
                                size="small"
                                onClick={() => window.open(`${API_URL}/api/violations/${row._id}/challan`)}
                                sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}
                              >
                                <PictureAsPdfIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {row.payment_status === 'pending' && (
                              <Tooltip title="Settle Challan">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/pay/${row._id}`)}
                                  sx={{ color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.05)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}
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

          {/* Numbered circular pagination matching screenshot exactly */}
          {violations.length > rowsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={Math.ceil(violations.length / rowsPerPage)} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#64748b',
                    fontWeight: 700,
                    '&.Mui-selected': {
                      bgcolor: '#6366f1',
                      color: '#fff',
                      '&:hover': { bgcolor: '#4f46e5' }
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#fff' }
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}