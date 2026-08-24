import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
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
  Tooltip as ChartTooltip,
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
  ChartTooltip,
  Legend
);

export default function Charts() {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChartsData = async () => {
    try {
      const [statsRes, forecastRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/forecasting').catch(() => ({ data: { historical: [], projected: [] } }))
      ]);
      setStats(statsRes.data);
      setForecast(forecastRes.data);
    } catch (error) {
      console.error('Error fetching charts analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartsData();
    const interval = setInterval(fetchChartsData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }} className="animate-slide-up">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}><Skeleton width={220} /></Typography>
          <Skeleton width={340} />
        </Box>
        
        {/* Metric Cards Row Skeleton */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
            gap: 3, 
            mb: 4, 
            width: '100%' 
          }}
        >
          {[1, 2, 3].map((i) => (
            <Card key={i} sx={{ width: '100%', borderRadius: '16px', bgcolor: '#0d121f', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Skeleton width={120} height={20} />
                <Skeleton width={80} height={48} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Charts Grid Skeleton */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
            gap: 3, 
            width: '100%' 
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} sx={{ width: '100%', borderRadius: '16px', bgcolor: '#0d121f', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton width={180} height={24} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={260} sx={{ borderRadius: 4 }} />
              </CardContent>
            </Card>
          ))}
          {/* Forecasting skeleton */}
          <Card sx={{ width: '100%', gridColumn: { xs: 'span 1', lg: 'span 2' }, borderRadius: '16px', bgcolor: '#0d121f', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton width={280} height={24} sx={{ mb: 1 }} />
              <Skeleton width={180} height={16} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  const s = stats || {
    daily_trend: {},
    violation_types: {},
    vehicle_types: {},
    collected_fine: 0,
    pending_fine: 0,
    today_violations: 0,
    weekly_violations: 0,
    monthly_violations: 0,
    top_areas: {}
  };

  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748B';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#f8fafc' : '#0f172a',
          font: { family: 'Outfit', size: 12, weight: 600 },
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        font: { family: 'Inter' }
      }
    },
    scales: {
      x: {
        grid: { color: 'transparent' },
        ticks: { color: textColor, font: { family: 'Outfit', size: 11 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Outfit', size: 11 } }
      }
    }
  };

  // 1. Daily Violations Trend Chart
  const dailyLabels = Object.keys(s.daily_trend);
  const dailyValues = Object.values(s.daily_trend);
  const dailyData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Daily Violations Count',
        data: dailyValues,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        tension: 0.45,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointHoverRadius: 7,
        pointRadius: 4,
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
        label: 'Offenses Logged',
        data: typeValues,
        backgroundColor: [
          '#ef4444', // Red Light
          '#f59e0b', // Speeding
          '#ec4899', // Helmet
          '#06b6d4', // Seatbelt
          '#a855f7', // Triple Riding
          '#10b981', // Wrong Lane
          '#3b82f6', // Wrong direction
          '#64748b'  // Illegal parking
        ],
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 24,
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
        backgroundColor: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#a855f7'],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#111827' : '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  // 4. Fine Collection (Paid vs Pending)
  const fineData = {
    labels: ['COLLECTED FINES (PAID)', 'OUTSTANDING FINES (PENDING)'],
    datasets: [
      {
        label: 'Total Fine (₹)',
        data: [s.collected_fine, s.pending_fine],
        backgroundColor: ['rgba(34, 197, 94, 0.85)', 'rgba(239, 68, 68, 0.85)'],
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 35,
      }
    ]
  };

  // 5. Predictive analytics traffic chart (Double Exponential)
  const historicalHours = forecast?.historical?.map(h => h.hour) || [];
  const projectedHours = forecast?.projected?.map(h => h.hour) || [];
  const allForecastLabels = [...historicalHours, ...projectedHours];

  const historicalValues = forecast?.historical?.map(h => h.count) || [];
  const projectedValues = forecast?.projected?.map(h => h.count) || [];

  const historicalDataset = [...historicalValues, ...Array(projectedValues.length).fill(null)];
  const projectedDataset = [...Array(historicalValues.length).fill(null), ...projectedValues];

  const forecastData = {
    labels: allForecastLabels,
    datasets: [
      {
        label: 'Actual Violations (Last 24h)',
        data: historicalDataset,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
      },
      {
        label: 'AI Projected Trend (Next 24h)',
        data: projectedDataset,
        borderColor: '#a855f7',
        borderDash: [5, 5],
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
      }
    ]
  };

  // 6. Top Violation Areas
  const topAreasLabels = s.top_areas ? Object.keys(s.top_areas).map(a => a.replace(/_/g, ' ').toUpperCase()) : [];
  const topAreasValues = s.top_areas ? Object.values(s.top_areas) : [];
  const topAreasData = {
    labels: topAreasLabels,
    datasets: [
      {
        label: 'Violations Logged',
        data: topAreasValues,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 28
      }
    ]
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }} className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Analytical Traffic Reports
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Time-series breakdowns, violation categories, and predictive forecasting
        </Typography>
      </Box>

      {/* Metric Cards Row - Responsive CSS Grid */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
          gap: 3, 
          mb: 4, 
          width: '100%' 
        }}
      >
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderLeft: '5px solid #6366f1',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Today's Incidents
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
              {s.today_violations}
            </Typography>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderLeft: '5px solid #a855f7',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Weekly Incidents
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
              {s.weekly_violations}
            </Typography>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderLeft: '5px solid #22c55e',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Monthly Incidents
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
              {s.monthly_violations}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Primary Graphs CSS Grid */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
          gap: 3, 
          width: '100%',
          alignItems: 'start'
        }}
      >
        {/* Daily Trend Line Chart */}
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              📈 Daily Violations Trend (Last 7 Days)
            </Typography>
            <Box sx={{ height: 260 }}>
              <Line data={dailyData} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>

        {/* Violations Type Bar Chart */}
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              📊 Violation Categories Distribution
            </Typography>
            <Box sx={{ height: 260 }}>
              <Bar data={typeData} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>

        {/* Vehicle Classification Doughnut */}
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
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
                        font: { family: 'Outfit', size: 11, weight: 600 }
                      }
                    }
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Fine Collection Performance */}
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
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

        {/* Top Violation Areas Bar Chart */}
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              📍 Top Violation Areas (Location Volumes)
            </Typography>
            <Box sx={{ height: 260 }}>
              <Bar
                data={topAreasData}
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

        {/* Full-width forecasting chart */}
        <Card 
          sx={{ 
            width: '100%',
            gridColumn: { xs: 'span 1', lg: 'span 2' },
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              🔮 AI Predictive Analytics: 24-Hour Traffic Violation Forecast
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Calculated using Holt's Double Exponential Smoothing and daily traffic seasonality cycles
            </Typography>
            <Box sx={{ height: 320 }}>
              {forecast ? (
                <Line data={forecastData} options={chartOptions} />
              ) : (
                <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}