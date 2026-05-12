import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Card, CardContent, Chip, Grid, Stack, Button, Avatar,
  IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkIcon from '@mui/icons-material/Link';
import SchoolIcon from '@mui/icons-material/School';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ArticleIcon from '@mui/icons-material/Article';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FilterListIcon from '@mui/icons-material/FilterList';

const STORAGE_KEY = 'vivaai_saved_resources';

export const saveResource = (resource) => {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const exists = saved.find(r => r.id === resource.id);
  if (!exists) {
    saved.unshift({ ...resource, savedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
  return !exists;
};

export const getSavedResources = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

export const removeResource = (id) => {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const filtered = saved.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};

const getResourceIcon = (type) => {
  switch (type) {
    case 'video': return <PlayCircleIcon sx={{ fontSize: 20, color: '#ef4444' }} />;
    case 'article': return <ArticleIcon sx={{ fontSize: 20, color: '#4361ee' }} />;
    case 'documentation': return <SchoolIcon sx={{ fontSize: 20, color: '#10b981' }} />;
    case 'search': return <SearchIcon sx={{ fontSize: 20, color: '#f59e0b' }} />;
    case 'insight': return <LightbulbIcon sx={{ fontSize: 20, color: '#6366f1' }} />;
    default: return <LinkIcon sx={{ fontSize: 20, color: '#64748b' }} />;
  }
};

const getResourceColor = (type) => {
  switch (type) {
    case 'video': return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
    case 'article': return { bg: '#eef2ff', border: '#c7d2fe', text: '#4361ee' };
    case 'documentation': return { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' };
    case 'search': return { bg: '#fffbeb', border: '#fde68a', text: '#d97706' };
    case 'insight': return { bg: '#f5f3ff', border: '#ddd6fe', text: '#7c3aed' };
    default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };
  }
};

const getDomainFromUrl = (url) => {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
};

const ResourceCard = ({ resource, onDelete }) => {
  const colors = getResourceColor(resource.type);
  const domain = getDomainFromUrl(resource.url);
  const isVideo = resource.type === 'video' || resource.url?.includes('youtube') || resource.url?.includes('youtu.be');
  const getYouTubeId = (url) => {
    const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return m ? m[1] : null;
  };
  const ytId = isVideo ? getYouTubeId(resource.url) : null;

  return (
    <Card sx={{ borderRadius: 3, border: `1px solid ${colors.border}`, boxShadow: 'none', overflow: 'hidden', transition: 'all 0.2s', '&:hover': { boxShadow: `0 4px 16px ${colors.border}80`, transform: 'translateY(-2px)' } }}>
      {ytId && (
        <Box sx={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen title={resource.title}
          />
        </Box>
      )}
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, backgroundColor: colors.bg, borderRadius: 2 }}>
            {getResourceIcon(resource.type)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.3, lineHeight: 1.3 }} noWrap>
              {resource.title}
            </Typography>
            {domain && (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>{domain}</Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => onDelete(resource.id)} sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444' } }}>
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {resource.relevance && (
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
            {resource.relevance}
          </Typography>
        )}

        {resource.vivaName && (
          <Chip label={resource.vivaName} size="small" sx={{ mr: 0.5, mb: 0.5, height: 22, fontSize: '0.68rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
        )}
        <Chip label={resource.type || 'resource'} size="small" sx={{ mb: 0.5, height: 22, fontSize: '0.68rem', fontWeight: 600, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }} />

        {resource.url && (
          <Button fullWidth variant="outlined" size="small" component="a" href={resource.url} target="_blank" rel="noopener"
            startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', fontWeight: 600, borderColor: colors.border, color: colors.text, '&:hover': { backgroundColor: colors.bg, borderColor: colors.text } }}>
            Open Resource
          </Button>
        )}

        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#cbd5e1', fontSize: '0.65rem' }}>
          Saved {new Date(resource.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      </CardContent>
    </Card>
  );
};

const SavedResourcesPage = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [tab, setTab] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { setResources(getSavedResources()); }, []);

  const handleDelete = (id) => {
    const updated = removeResource(id);
    setResources(updated);
    setConfirmDelete(null);
  };

  const handleClearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setResources([]);
    setConfirmDelete(null);
  };

  const filtered = tab === 'all' ? resources : resources.filter(r => r.type === tab);
  const types = ['all', ...new Set(resources.map(r => r.type).filter(Boolean))];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/main')} sx={{ border: '1px solid #e2e8f0' }}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Saved Resources</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Your curated study materials and AI insights ({resources.length} saved)
            </Typography>
          </Box>
        </Box>
        {resources.length > 0 && (
          <Button variant="outlined" size="small" color="error" onClick={() => setConfirmDelete('all')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Clear All
          </Button>
        )}
      </Box>

      {/* Filter Tabs */}
      {resources.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', minHeight: 36, borderRadius: 2, mr: 0.5 },
              '& .Mui-selected': { color: '#4361ee', backgroundColor: '#eef2ff' }, '& .MuiTabs-indicator': { display: 'none' } }}>
            {types.map(t => <Tab key={t} label={t === 'all' ? `All (${resources.length})` : `${t} (${resources.filter(r => r.type === t).length})`} value={t} />)}
          </Tabs>
        </Box>
      )}

      {/* Resources Grid */}
      {filtered.length > 0 ? (
        <Grid container spacing={2.5}>
          {filtered.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <ResourceCard resource={resource} onDelete={(id) => setConfirmDelete(id)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
          <BookmarkIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>No saved resources yet</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, maxWidth: 400, mx: 'auto' }}>
            When you use the AI Study Agent on your interview results, you can save resources and insights here for easy access.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/viva-results')} startIcon={<AutoAwesomeIcon />}
            sx={{ borderRadius: 2, textTransform: 'none', backgroundColor: '#4361ee', '&:hover': { backgroundColor: '#3730a3' } }}>
            Go to My Results
          </Button>
        </Paper>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {confirmDelete === 'all' ? 'Clear all resources?' : 'Remove this resource?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmDelete === 'all' ? 'This will permanently remove all your saved resources.' : 'This resource will be removed from your saved items.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => confirmDelete === 'all' ? handleClearAll() : handleDelete(confirmDelete)}
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            {confirmDelete === 'all' ? 'Clear All' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedResourcesPage;
