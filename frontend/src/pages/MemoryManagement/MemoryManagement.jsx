import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Collapse,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Mic as MicIcon,
  Book as BookIcon,
  Today as TodayIcon,
  Group as GroupIcon,
  Build as BuildIcon,
  Psychology as PsychologyIcon,
  Folder as FolderIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material'
import { useMemory } from '../../context/MemoryContext'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import CreateMemoryCardDialog from '../../components/MemoryCard/CreateMemoryCardDialog'
import QuickVoiceRecordDialog from '../../components/MemoryCard/QuickVoiceRecordDialog'
import EditMemoryCardDialog from '../../components/MemoryCard/EditMemoryCardDialog'
import ViewMemoryCardDialog from '../../components/MemoryCard/ViewMemoryCardDialog'
import MemoryCard from '../../components/MemoryCard/MemoryCard'

const MemoryManagement = () => {
  const { memories, loading, error, deleteMemory } = useMemory()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memoryToDelete, setMemoryToDelete] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [quickRecordDialogOpen, setQuickRecordDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [memoryToEdit, setMemoryToEdit] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [memoryToView, setMemoryToView] = useState(null)
  const [aiAssistantOpen, setAIAssistantOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [initialCategoryKey, setInitialCategoryKey] = useState(null)
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('memories.view')
    return saved === 'timeline' ? 'timeline' : 'categories'
  })

  // Category helpers (moved above filteredMemories to avoid TDZ errors)
  const CATEGORY_META = {
    life_story: { title: 'Life Story', gradient: 'linear-gradient(135deg, #E86A92 0%, #F3A7C1 100%)', icon: <BookIcon /> },
    daily_records: { title: 'Daily Records', gradient: 'linear-gradient(135deg, #FF7E6E 0%, #FFB09F 100%)', icon: <TodayIcon /> },
    people_relationships: { title: 'People & Relationships', gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44B3B8 100%)', icon: <GroupIcon /> },
    skills_routines: { title: 'Skills & Routines', gradient: 'linear-gradient(135deg, #45B7D1 0%, #96C7ED 100%)', icon: <BuildIcon /> },
    feelings_thoughts: { title: 'Feelings & Thoughts', gradient: 'linear-gradient(135deg, #FFB84D 0%, #FFD93D 100%)', icon: <PsychologyIcon /> },
    others: { title: 'Others', gradient: 'linear-gradient(135deg, #95A5A6 0%, #BDC3C7 100%)', icon: <FolderIcon /> },
  }

  const getCategoryFromTags = (tags) => {
    const list = Array.isArray(tags) ? tags : []
    const cat = list.find(t => typeof t === 'string' && t.startsWith('category:'))
    if (!cat) return 'others'
    const key = cat.split(':')[1] || 'others'
    return CATEGORY_META[key] ? key : 'others'
  }

  // Handle URL parameters for different actions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    if (action === 'create') {
      setCreateDialogOpen(true)
    } else if (action === 'quick-record') {
      setQuickRecordDialogOpen(true)
    }
  }, [])

  // Ensure page starts at the top when navigating here
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  console.log(
  'has undefined item?',
  Array.isArray(memories) && memories.some(m => m == null),
  memories
);

  // Filter memory cards (clear empty values first, then safely read)
  const base = Array.isArray(memories) ? memories.filter(Boolean) : []
  const q = (searchTerm || '').toLowerCase()
  const filteredMemories = base
    .filter(m => m && typeof m === 'object')
    .filter(m => {
      const titleMatch = (m.title ?? '').toLowerCase().includes(q)
      const contentMatch = (m.content ?? '').toLowerCase().includes(q)
      // Match category name as well (e.g., typing "life" matches "Life Story")
      const categoryKey = getCategoryFromTags(m.tags)
      const categoryTitle = (CATEGORY_META[categoryKey]?.title || '').toLowerCase()
      const categoryMatch = categoryTitle.includes(q)
      return titleMatch || contentMatch || categoryMatch
    })

  // (moved helpers above)

  // Group filtered memories by category for rendering 6 sections
  const groupedByCategory = useMemo(() => {
    const groups = {
      life_story: [],
      daily_records: [],
      people_relationships: [],
      skills_routines: [],
      feelings_thoughts: [],
      others: [],
    }
    filteredMemories.forEach(m => {
      const key = getCategoryFromTags(m.tags)
      groups[key].push(m)
    })
    // Optional: sort by updated_at or created_at (desc)
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    })
    return groups
  }, [filteredMemories])

  // Group by timeline buckets
  const groupedByTimeline = useMemo(() => {
    const buckets = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      earlier: [],
    }
    filteredMemories.forEach(m => {
      const d = new Date(m.updated_at || m.created_at)
      if (isToday(d)) buckets.today.push(m)
      else if (isYesterday(d)) buckets.yesterday.push(m)
      else if (isThisWeek(d)) buckets.thisWeek.push(m)
      else if (isThisMonth(d)) buckets.thisMonth.push(m)
      else buckets.earlier.push(m)
    })
    const sortDesc = (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    Object.keys(buckets).forEach(k => buckets[k].sort(sortDesc))
    return buckets
  }, [filteredMemories])

  // Handle edit
  const handleEditClick = (memory) => {
    setMemoryToEdit(memory)
    setEditDialogOpen(true)
  }

  const handleEditClose = () => {
    setEditDialogOpen(false)
    setMemoryToEdit(null)
  }

  const handleViewClick = (memory) => {
    setMemoryToView(memory)
    setViewDialogOpen(true)
  }

  const handleViewClose = () => {
    setViewDialogOpen(false)
    setMemoryToView(null)
  }

  // Handle delete confirmation
  const handleDeleteClick = (memory) => {
    setMemoryToDelete(memory)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteMemory(memoryToDelete.id)
      setDeleteDialogOpen(false)
      setMemoryToDelete(null)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setMemoryToDelete(null)
  }

  return (
    <Box>
      {/* Enhanced Page Title */}
      <Box sx={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderRadius: 3,
        p: 4,
        mb: 4,
        border: '1px solid #E0E0E0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0%, rgba(255, 152, 0, 0.03) 100%)',
          pointerEvents: 'none'
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 900,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #9C27B0 0%, #FF9800 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              textAlign: 'center',
              mb: 2,
              textShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            Manage your memory cards
          </Typography>
          
          {/* Decorative line */}
          <Box sx={{
            width: 100,
            height: 4,
            background: 'linear-gradient(135deg, #9C27B0 0%, #FF9800 100%)',
            borderRadius: 2,
            mx: 'auto',
            mb: 2
          }} />
          
        </Box>
      </Box>
      {/* Clear create actions at the top */}
      <Grid container spacing={4} mb={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 5, overflow: 'hidden' }}>
            <CardActionArea onClick={() => { setInitialCategoryKey(null); setCreateDialogOpen('text'); setQuickRecordDialogOpen(false); }}>
              <Box sx={{ p: { xs: 4, md: 6 }, minHeight: { xs: 180, md: 220 }, background: 'linear-gradient(135deg, #8B6FAC 0%, #A98BBD 100%)', color: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ width: { xs: 72, md: 96 }, height: { xs: 72, md: 96 }, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    <EditIcon sx={{ fontSize: { xs: 44, md: 64 } }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>Text Input</Typography>
                    <Typography sx={{ opacity: 0.95, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>Create memory cards by typing</Typography>
                  </Box>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 5, overflow: 'hidden' }}>
            <CardActionArea onClick={() => { setInitialCategoryKey(null); setQuickRecordDialogOpen(false); setCreateDialogOpen('voice'); }}>
              <Box sx={{ p: { xs: 4, md: 6 }, minHeight: { xs: 180, md: 220 }, background: 'linear-gradient(135deg, #FF9671 0%, #FFB598 100%)', color: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ width: { xs: 72, md: 96 }, height: { xs: 72, md: 96 }, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    <MicIcon sx={{ fontSize: { xs: 44, md: 64 } }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>Voice Input</Typography>
                    <Typography sx={{ opacity: 0.95, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>Create memory cards by recording</Typography>
                  </Box>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* View Toggle - prominent under create actions */}
      <Box mb={3}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => { if (v) { setViewMode(v); localStorage.setItem('memories.view', v) } }}
          size="medium"
          sx={{
            '& .MuiToggleButton-root': {
              px: 2.5,
              py: 1.2,
              fontWeight: 700,
              fontSize: { xs: '0.95rem', md: '1rem' },
              borderRadius: 2,
            },
            boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
            borderRadius: 2,
          }}
        >
          <ToggleButton value="categories">Categories</ToggleButton>
          <ToggleButton value="timeline">Timeline</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      

      {/* Search Bar */}
      <Box mb={4}>
        <TextField
          fullWidth
          placeholder="Search memory cards..."
          value={searchTerm}
          onChange={(e) => {
            const v = e.target.value
            setSearchTerm(v)
            // Auto switch to timeline view while searching
            if (v && viewMode !== 'timeline') {
              setViewMode('timeline')
              localStorage.setItem('memories.view', 'timeline')
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9E9E9E' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FFFFFF',
              borderRadius: 3,
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
              '& fieldset': { border: 'none' },
              '&:hover': { boxShadow: '0 8px 22px rgba(0,0,0,0.08)' },
              '&.Mui-focused': { boxShadow: '0 10px 26px rgba(0,0,0,0.12)' },
            },
            '& .MuiInputBase-input': {
              fontSize: '1.15rem',
              padding: '18px 16px',
            },
          }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Memory Cards Grouped by Category */}
      {!loading && (
        <Box>

          {viewMode === 'timeline' ? (
            <Box>
              {[
                ['today', 'Today'],
                ['yesterday', 'Yesterday'],
                ['thisWeek', 'This Week'],
                ['thisMonth', 'This Month'],
                ['earlier', 'Earlier'],
              ].map(([key, label]) => (
                groupedByTimeline[key].length === 0 ? null : (
                  <Box key={key} mb={4}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{label}</Typography>
                    <Grid container spacing={3}>
                      {groupedByTimeline[key].map((memory, index) => (
                        <Grid item xs={12} key={memory.id}>
                          <MemoryCard
                            memory={memory}
                            index={index}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onView={handleViewClick}
                            variant="default"
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )
              ))}
            </Box>
          ) : (
            [
              'life_story',
              'daily_records',
              'people_relationships',
              'skills_routines',
              'feelings_thoughts',
              'others',
            ].map((key) => (
              <Box key={key} mb={4}>
                {/* Album cover card */}
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <CardActionArea onClick={() => setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }))}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 3,
                        background: CATEGORY_META[key].gradient,
                        color: '#FFFFFF',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
                            '& .MuiSvgIcon-root': {
                              fontSize: 30,
                            },
                          }}
                        >
                          {CATEGORY_META[key].icon}
                        </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                          {CATEGORY_META[key].title}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                      <Button size="small" variant="contained" sx={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF', fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); setInitialCategoryKey(key); setCreateDialogOpen(true) }}>Add to this category</Button>
                        <Typography sx={{ opacity: 0.9, fontWeight: 700 }}>
                          {groupedByCategory[key].length} cards
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                  <Collapse in={!!expandedCategories[key]} timeout="auto" unmountOnExit>
                    <CardContent sx={{ bgcolor: '#FFFFFF' }}>
                      {groupedByCategory[key].length === 0 ? (
                        <Typography color="text.secondary">No cards in this category</Typography>
                      ) : (
                        <Grid container spacing={3}>
                          {groupedByCategory[key].map((memory, index) => (
                            <Grid item xs={12} sm={6} lg={4} key={memory.id}>
                              <MemoryCard
                                memory={memory}
                                index={index}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onView={handleViewClick}
                                variant="default"
                              />
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </CardContent>
                  </Collapse>
                </Card>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* AI Assistant Entry (placeholder) */}
      <Tooltip title={<Typography sx={{ fontSize: 16, fontWeight: 700 }}>AI Assistant</Typography>} placement="left">
        <Fab
          color="primary"
          aria-label="ai assistant"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 72,
            height: 72,
          }}
          onClick={() => setAIAssistantOpen(true)}
        >
          <SmartToyIcon sx={{ fontSize: 32 }} />
        </Fab>
      </Tooltip>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the memory card "{memoryToDelete?.title || 'No Title'}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Memory Card Dialog */}
      <CreateMemoryCardDialog
        open={!!createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        initialCategoryKey={initialCategoryKey}
        initialActiveTab={createDialogOpen === 'voice' ? 1 : 0}
        skipInputMethod={createDialogOpen === 'voice' || createDialogOpen === 'text'}
      />

      {/* Edit Memory Card Dialog */}
      <EditMemoryCardDialog
        open={editDialogOpen}
        memory={memoryToEdit}
        onClose={handleEditClose}
      />

      {/* View Memory Card Dialog */}
      <ViewMemoryCardDialog
        open={viewDialogOpen}
        memory={memoryToView}
        onClose={handleViewClose}
        onEdit={handleEditClick}
      />

      {/* Quick Voice Record Dialog */}
      <QuickVoiceRecordDialog
        open={quickRecordDialogOpen}
        onClose={() => setQuickRecordDialogOpen(false)}
      />

      {/* AI Assistant Placeholder */}
      <Dialog open={aiAssistantOpen} onClose={() => setAIAssistantOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Assistant</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Coming soon. This assistant will answer questions and create memory-based games.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We will use your existing memory cards to support Q&A and simple training games.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAIAssistantOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MemoryManagement
