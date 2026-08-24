import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material/styles';

import api, { API_URL } from '../services/api';

// Create styled glowing markers to bypass default Leaflet image import issues
const getCameraIcon = () => L.divIcon({
  html: `<div style="background-color: #6366f1; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 14px #6366f1;"></div>`,
  className: 'glow-camera-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const getViolationIcon = (type) => {
  const color = type === 'red_light' || type === 'wrong_lane' || type === 'wrong_direction' ? '#ef4444' : '#f59e0b';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    className: 'glow-violation-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

// Seed Camera coordinates (Pune, Delhi, Bangalore)
const cameraLocations = [
  { id: 'CAM-PUNE-01', name: 'Shivajinagar Highway, Pune', coords: [18.5304, 73.8530], status: 'Active' },
  { id: 'CAM-DELHI-02', name: 'Dwarka Sector 15 Cross, Delhi', coords: [28.5910, 77.0510], status: 'Active' },
  { id: 'CAM-BLR-03', name: 'Koramangala Ring Road, Bangalore', coords: [12.9344, 77.6244], status: 'Active' }
];

export default function MapModule() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [mapCenter] = useState([18.5204, 73.8567]); // Center on Pune by default

  const isDark = theme.palette.mode === 'dark';

  const fetchViolations = async () => {
    try {
      const res = await api.get('/api/violations');
      setViolations(res.data.violations || []);
    } catch (err) {
      console.error('Failed to load violations for GIS Map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  // Map database violation entries to geo-coordinates near camera installations
  const getViolationCoords = (violation, index) => {
    const loc = violation.location.toLowerCase();
    const plate = violation.license_plate.toUpperCase();
    
    let baseCoords = [18.5304, 73.8530]; // Default Pune
    
    if (loc.includes('delhi') || loc.includes('dwarka') || plate.startsWith('DL')) {
      baseCoords = [28.5910, 77.0510];
    } else if (loc.includes('bangalore') || loc.includes('koramangala') || plate.startsWith('KA')) {
      baseCoords = [12.9344, 77.6244];
    }
    
    // Add jitter offset so markers don't overlap completely
    const jitterX = (Math.sin(index) * 0.008);
    const jitterY = (Math.cos(index) * 0.008);
    return [baseCoords[0] + jitterX, baseCoords[1] + jitterY];
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.license_plate.toLowerCase().includes(search.toLowerCase()) || 
                          v.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || v.violation_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <Box className="animate-slide-up">
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}><Skeleton width={220} /></Typography>
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  return (
    <Box className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          GIS Surveillance Map
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Real-time geographical tracking of AI-logged traffic offenses and active junction cameras
        </Typography>
      </Box>

      {/* Advanced Map Filters Toolbar */}
      <Card sx={{ mb: 4, borderRadius: '16px' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                label="Search by Vehicle Plate / Spot"
                placeholder="e.g. MH12AB1234"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Offense Filter"
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
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <div style={{ backgroundColor: '#6366f1', width: 10, height: 10, borderRadius: '50%', boxShadow: '0 0 6px #6366f1' }}></div>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>Cameras ({cameraLocations.length})</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <div style={{ backgroundColor: '#ef4444', width: 10, height: 10, borderRadius: '50%', boxShadow: '0 0 6px #ef4444' }}></div>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>Violations ({filteredViolations.length})</Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.65)' }}>
        <Box sx={{ height: '600px', width: '100%', position: 'relative' }}>
          <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
            {/* Custom dark theme tile layers */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={isDark 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              }
            />
            
            {/* Draw active Camera Markers */}
            {cameraLocations.map((cam) => (
              <Marker key={cam.id} position={cam.coords} icon={getCameraIcon()}>
                <Popup>
                  <Box sx={{ p: 0.5, fontFamily: '"Outfit", sans-serif' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
                      📹 {cam.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: 10 }}>
                      Camera Sensor Node ID: {cam.id}
                    </Typography>
                    <Chip 
                      label="CAMERA ACTIVE" 
                      color="success" 
                      size="small" 
                      sx={{ fontWeight: 800, fontSize: 9.5, height: 20 }} 
                    />
                  </Box>
                </Popup>
              </Marker>
            ))}

            {/* Draw violation markers dynamically */}
            {filteredViolations.map((v, index) => {
              const coords = getViolationCoords(v, index);
              return (
                <Marker key={v._id} position={coords} icon={getViolationIcon(v.violation_type)}>
                  <Popup>
                    <Box sx={{ p: 0.5, minWidth: 200, fontFamily: '"Outfit", sans-serif' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'error.main', mb: 0.5 }}>
                        🚨 {v.violation_type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Divider sx={{ my: 0.75 }} />
                      
                      <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5, color: '#f8fafc' }}>
                        Vehicle Plate: {v.license_plate}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.25, fontSize: 11 }}>
                        Fine Amount: ₹{v.fine_amount}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.25, fontSize: 11 }}>
                        Status: <strong>{v.payment_status.toUpperCase()}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2, fontSize: 10 }}>
                        Logged: {new Date(v.timestamp).toLocaleString()}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => navigate(`/pay/${v._id}`)}
                        disabled={v.payment_status === 'paid'}
                        sx={{ py: 0.8, textTransform: 'none', fontWeight: 800, fontSize: 11 }}
                      >
                        {v.payment_status === 'paid' ? 'Settled Case' : 'Process Payment'}
                      </Button>
                    </Box>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </Box>
      </Card>
    </Box>
  );
}
