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

import api, { API_URL } from '../services/api';

// Create styled glowing markers to bypass default Leaflet image import issues
const getCameraIcon = () => L.divIcon({
  html: `<div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px #10b981;"></div>`,
  className: 'glow-camera-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const getViolationIcon = (type) => {
  const color = type === 'red_light' ? '#ef4444' : '#f59e0b';
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
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [mapCenter] = useState([18.5204, 73.8567]); // Center on Pune by default

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
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}><Skeleton width={200} /></Typography>
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          🗺️ Interactive GIS Traffic Map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track spatial locations of AI violations and camera feeds in real time
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={5}>
          <TextField
            label="Search by Vehicle Plate"
            placeholder="e.g. MH12AB1234"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Violation Type Filter"
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
          <Box sx={{ p: 1.5, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <div style={{ backgroundColor: '#10b981', width: 10, height: 10, borderRadius: '50%' }}></div>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Cameras ({cameraLocations.length})</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <div style={{ backgroundColor: '#ef4444', width: 10, height: 10, borderRadius: '50%' }}></div>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Violations ({filteredViolations.length})</Typography>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', boxShadow: 3 }}>
        <Box sx={{ height: '600px', width: '100%', position: 'relative' }}>
          <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Draw active Camera Markers */}
            {cameraLocations.map((cam) => (
              <Marker key={cam.id} position={cam.coords} icon={getCameraIcon()}>
                <Popup>
                  <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      📹 {cam.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Camera ID: {cam.id}
                    </Typography>
                    <Chip label={cam.status} color="success" size="small" sx={{ fontWeight: 700, fontSize: 10 }} />
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
                    <Box sx={{ p: 1, minWidth: 180 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main', mb: 0.5 }}>
                        🚨 {v.violation_type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Divider sx={{ my: 0.5 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Plate: {v.license_plate}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        Fine: ₹{v.fine_amount} | Status: {v.payment_status.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1.5 }}>
                        Time: {new Date(v.timestamp).toLocaleDateString()} {new Date(v.timestamp).toLocaleTimeString()}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => navigate(`/pay/${v._id}`)}
                        disabled={v.payment_status === 'paid'}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11 }}
                      >
                        {v.payment_status === 'paid' ? 'Paid & Settled' : 'Pay Challan'}
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
