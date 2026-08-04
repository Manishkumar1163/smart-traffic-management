import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import api from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Charts() {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}><Skeleton width={200} /></Typography>
        <Grid container spacing={4}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const s = stats || {
    daily_trend: {},
    violation_types: {},
    vehicle_types: {},
    collected_fine: 0,
    pending_fine: 0
  };

  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#f8fafc' : '#0f172a',
          font: { family: 'Outfit' }
        }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Outfit' } }
      }
    }
  };

  // 1. Daily Violations Trend Chart Data
  const dailyLabels = Object.keys(s.daily_trend);
  const dailyValues = Object.values(s.daily_trend);
  const dailyData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Daily Violations',
        data: dailyValues,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
      }
    ]
  };

  // 2. Violation Types distribution
  const typeLabels = Object.keys(s.violation_types).map(t => t.replace(/_/g, ' ').toUpperCase());
  const typeValues = Object.values(s.violation_types);
  const typeData = {
    labels: typeLabels,
    datasets: [
      {
        label: 'Count',
        data: typeValues,
        backgroundColor: [
          '#ef4444', // Red Light
          '#f59e0b', // Speeding
          '#ec4899', // Helmet
          '#06b6d4', // Seatbelt
          '#8b5cf6', // Triple Riding
          '#10b981', // Wrong Lane
          '#3b82f6', // Wrong direction
          '#64748b'  // Illegal parking
        ],
        borderRadius: 6
      }
    ]
  };

  // 3. Vehicle Type distribution (Doughnut)
  const vehicleLabels = Object.keys(s.vehicle_types).map(v => v.toUpperCase());
  const vehicleValues = Object.values(s.vehicle_types);
  const vehicleData = {
    labels: vehicleLabels,
    datasets: [
      {
        data: vehicleValues,
        backgroundColor: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#1e293b' : '#ffffff',
      }
    ]
  };

  // 4. Fine Collection (Paid vs Pending)
  const fineData = {
    labels: ['Paid Fine (Settled)', 'Pending Fine'],
    datasets: [
      {
        label: 'Fine Amount (INR)',
        data: [s.collected_fine, s.pending_fine],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderRadius: 8,
        barThickness: 50
      }
    ]
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          Analytics Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed metrics showing violation trends, distribution, and fine collections
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Daily Trend Line Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                📈 Daily Violations Trend (Last 7 Days)
              </Typography>
              <Box sx={{ height: 260 }}>
                <Line data={dailyData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Violations Type Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                📊 Violation Categories Distribution
              </Typography>
              <Box sx={{ height: 260 }}>
                <Bar data={typeData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle Classification Doughnut */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                🍩 Traffic Volume by Vehicle Type
              </Typography>
              <Box sx={{ height: 260, display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  data={vehicleData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: isDark ? '#f8fafc' : '#0f172a',
                          font: { family: 'Outfit', size: 11 }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fine Collection Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                💵 Fine Settlement Ledger (INR)
              </Typography>
              <Box sx={{ height: 260 }}>
                <Bar
                  data={fineData}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Outfit' } }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}