import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

import api, { API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { parseError } from '../utils/errorParser';

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
      alert(`Purge failed: ${parseError(err)}`);
    }
  };

  if (loading && videos.length === 0) {
    return (
      <Box className="animate-slide-up" sx={{ width: '100%' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}><Skeleton width={220} /></Typography>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
            gap: 3, 
            width: '100%' 
          }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={220} sx={{ borderRadius: '16px', width: '100%' }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Video Processing Archives
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Track background video analysis runs, monitor YOLOv8 progress, and review output challan entries
        </Typography>
      </Box>

      {videos.length === 0 ? (
        <Alert severity="info" variant="filled" sx={{ py: 3, borderRadius: '12px' }}>
          No offline traffic videos uploaded yet. Head to "Upload Video" to queue files.
        </Alert>
      ) : (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
            gap: 3, 
            width: '100%' 
          }}
        >
          {videos.map((video) => (
            <Card key={video._id} sx={{ borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', width: '100%', minWidth: 0 }}>
              <CardContent sx={{ p: 3, minWidth: 0 }}>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, mb: 1.5 }}>
                  🎬 {video.filename}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <Chip
                    label={video.processed ? 'Processed' : 'Processing...'}
                    size="small"
                    color={video.processed ? 'success' : 'warning'}
                    icon={!video.processed ? <CircularProgress size={10} color="inherit" /> : undefined}
                    sx={{ fontWeight: 800, borderRadius: '8px' }}
                  />
                  <Chip
                    label={`Violations: ${video.total_detections}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 800, borderRadius: '8px' }}
                  />
                </Box>
                
                <Stack spacing={1} sx={{ color: 'text.secondary', fontSize: 13 }}>
                  <Box>📍 Location: <strong>{video.location}</strong></Box>
                  <Box>📅 Uploaded: {new Date(video.uploaded_at).toLocaleString('en-IN')}</Box>
                </Stack>
              </CardContent>
              
              <CardActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="medium"
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
                    size="medium"
                    onClick={() => handleDeleteVideo(video._id)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Delete
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Detections Dialog */}
      {selectedVideo && (
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
              <AutoStoriesIcon color="primary" />
              Challans Audited from: {selectedVideo.filename}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider sx={{ opacity: 0.5 }} />
          
          <DialogContent sx={{ p: 3.5 }}>
            {detectionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : detections.length === 0 ? (
              <Box sx={{ p: 5, bgcolor: 'action.hover', borderRadius: '12px', textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No traffic violations detected in this video file. Good road safety compliance!
                </Typography>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                  gap: 3, 
                  width: '100%' 
                }}
              >
                {detections.map((d, index) => (
                  <Card key={d._id || index} variant="outlined" sx={{ borderRadius: '12px', p: 2.5, border: '1px solid rgba(99,102,241,0.15)', bgcolor: 'rgba(255, 255, 255, 0.01)', width: '100%', minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {d.violation_type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Chip
                        label="PENDING"
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 800, fontSize: 9.5 }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                    
                    <Stack spacing={0.8} sx={{ fontSize: 13, color: 'text.secondary', mb: 2.5 }}>
                      <Box>Vehicle Plate: <strong style={{ color: '#fff' }}>{d.license_plate}</strong></Box>
                      <Box>Fine Amount: <strong>₹{d.fine_amount}</strong></Box>
                      <Box>Confidence Score: <strong>{(d.confidence_score * 100).toFixed(0)}%</strong></Box>
                    </Stack>
                    
                    {d.screenshot_path && (
                      <Box sx={{ width: '100%', height: 130, overflow: 'hidden', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <img
                          src={`${API_URL}/screenshots/${d.screenshot_path}`}
                          alt="Detection evidence"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </Box>
                    )}
                  </Card>
                ))}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}