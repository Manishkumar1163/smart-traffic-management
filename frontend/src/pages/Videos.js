import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import api, { API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Videos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detections Modal State
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [detections, setDetections] = useState([]);
  const [detectionsLoading, setDetectionsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const fetchVideos = async () => {
    try {
      const res = await api.get('/api/videos');
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 5000); // Poll status every 5s
    return () => clearInterval(interval);
  }, []);

  const handleOpenDetections = async (video) => {
    setSelectedVideo(video);
    setOpenModal(true);
    setDetectionsLoading(true);
    try {
      const res = await api.get(`/api/videos/${video._id}/detections`);
      setDetections(res.data || []);
    } catch (err) {
      console.error('Failed to load video detections:', err);
      setDetections([]);
    } finally {
      setDetectionsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedVideo(null);
    setDetections([]);
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video file and all its associated database challans? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/api/videos/${videoId}`);
      alert('Video and associated logs purged successfully.');
      fetchVideos();
    } catch (err) {
      alert(`Purge failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  if (loading && videos.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}><Skeleton width={200} /></Typography>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
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
          📹 Processed Traffic Video Archives
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse offline video processing queue, review YOLOv8 tracking logs, and audit results
        </Typography>
      </Box>

      {videos.length === 0 ? (
        <Alert severity="info" sx={{ py: 3, borderRadius: 3 }}>
          No offline traffic videos uploaded yet. Head to "Upload Video" to queue files.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video._id}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, noWrap: true, mb: 1 }}>
                    🎬 {video.filename}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={video.processed ? 'Processed' : 'Processing'}
                      size="small"
                      color={video.processed ? 'success' : 'warning'}
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                    <Chip
                      label={`Violations: ${video.total_detections}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </Box>
                  
                  <Stack spacing={0.8} sx={{ color: 'text.secondary', fontSize: 13 }}>
                    <Box>📍 Location: <strong>{video.location}</strong></Box>
                    <Box>📅 Uploaded: {new Date(video.uploaded_at).toLocaleString('en-IN')}</Box>
                  </Stack>
                </CardContent>
                
                <CardActions sx={{ px: 3, pb: 3, gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!video.processed}
                    onClick={() => handleOpenDetections(video)}
                    sx={{ textTransform: 'none', fontWeight: 700, flex: 1 }}
                  >
                    View Challan Logs
                  </Button>
                  
                  {user && user.role === 'admin' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteVideo(video._id)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Delete
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detections Dialog */}
      {selectedVideo && (
        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Challans Audited from: {selectedVideo.filename}</span>
            <Button onClick={handleCloseModal} sx={{ fontWeight: 700 }}>Close</Button>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            {detectionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detections.length === 0 ? (
              <Box sx={{ p: 4, bgcolor: 'action.hover', borderRadius: 2, textalign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No traffic violations detected in this video file. Good road safety compliance!
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {detections.map((d, index) => (
                  <Grid item xs={12} sm={6} key={d._id || index}>
                    <Card variant="outlined" sx={{ borderRadius: 2.5, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {d.violation_type.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Chip
                          label="PENDING"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700, fontSize: 9, borderRadius: 1 }}
                        />
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Stack spacing={0.5} sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>
                        <Box>Vehicle Plate: <strong>{d.license_plate}</strong></Box>
                        <Box>Fine Amount: <strong>₹{d.fine_amount}</strong></Box>
                        <Box>Confidence Score: <strong>{(d.confidence_score * 100).toFixed(0)}%</strong></Box>
                      </Stack>
                      
                      {d.screenshot_path && (
                        <Box sx={{ width: '100%', height: 110, overflow: 'hidden', borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
                          <img
                            src={`${API_URL}/screenshots/${d.screenshot_path}`}
                            alt="Detection evidence"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </Box>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}