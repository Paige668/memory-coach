import React from 'react'
import { Dialog, DialogContent, Button, Box, Typography, Chip, IconButton } from '@mui/material'
import { AutoStories as LifeStoryIcon, Today as DailyRecordsIcon, People as PeopleIcon, Build as SkillsIcon, Psychology as FeelingsIcon, MoreHoriz as OthersIcon, Close as CloseIcon, Edit as EditIcon, ContentCopy as CopyIcon } from '@mui/icons-material'
import { format } from 'date-fns'

const categoryConfig = {
  life_story: { name: 'Life Story', icon: <LifeStoryIcon sx={{ fontSize: 16 }} />, color: '#E86A92' },
  daily_records: { name: 'Daily Records', icon: <DailyRecordsIcon sx={{ fontSize: 16 }} />, color: '#FF7E6E' },
  people_relationships: { name: 'People & Relationships', icon: <PeopleIcon sx={{ fontSize: 16 }} />, color: '#4ECDC4' },
  skills_routines: { name: 'Skills & Routines', icon: <SkillsIcon sx={{ fontSize: 16 }} />, color: '#45B7D1' },
  feelings_thoughts: { name: 'Feelings & Thoughts', icon: <FeelingsIcon sx={{ fontSize: 16 }} />, color: '#FFB84D' },
  others: { name: 'Others', icon: <OthersIcon sx={{ fontSize: 16 }} />, color: '#95A5A6' },
}

export default function ViewMemoryCardDialog({ open, onClose, memory, onEdit }) {
  if (!memory) return null
  const tags = Array.isArray(memory.tags) ? memory.tags : []
  const categoryTag = tags.find(t => typeof t === 'string' && t.startsWith('category:'))
  const categoryId = categoryTag ? categoryTag.replace('category:', '') : null
  const categoryInfo = categoryId ? categoryConfig[categoryId] : null
  const userTags = tags.filter(t => !String(t).startsWith('category:'))

  const gradients = {
    life_story: 'linear-gradient(135deg, #E86A92 0%, #F3A7C1 100%)',
    daily_records: 'linear-gradient(135deg, #FF7E6E 0%, #FFB09F 100%)',
    people_relationships: 'linear-gradient(135deg, #4ECDC4 0%, #44B3B8 100%)',
    skills_routines: 'linear-gradient(135deg, #45B7D1 0%, #96C7ED 100%)',
    feelings_thoughts: 'linear-gradient(135deg, #FFB84D 0%, #FFD93D 100%)',
    others: 'linear-gradient(135deg, #95A5A6 0%, #BDC3C7 100%)',
  }

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(memory.content || '')
    } catch (_) {}
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header strip */}
      <Box sx={{
        background: gradients[categoryId] || gradients.others,
        color: '#FFFFFF',
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: 24, md: 30 } } }}>
          {categoryInfo?.icon}
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.25rem', md: '1.6rem' } }}>{categoryInfo?.name || 'Memory'}</Typography>
        </Box>
        <Box>
          {onEdit && (
            <IconButton onClick={() => onEdit(memory)} sx={{ color: '#FFFFFF' }} aria-label="Edit">
              <EditIcon />
            </IconButton>
          )}
          <IconButton onClick={handleCopy} sx={{ color: '#FFFFFF' }} aria-label="Copy">
            <CopyIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ maxWidth: 760, mx: 'auto' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
              {memory.title || 'Untitled memory'}
            </Typography>
          </Box>
          <Box sx={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', mb: 2 }} />
          <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: { xs: '1.05rem', md: '1.15rem' }, color: '#2C2C2C' }}>
            {memory.content}
          </Typography>

          {/* Meta info */}
          <Box mt={3} display="flex" flexWrap="wrap" gap={1.5} alignItems="center">
            {userTags.length > 0 && userTags.map((t, i) => (
              <Chip key={i} label={t} size="small" variant="outlined" />
            ))}
            <Box sx={{ flexGrow: 1 }} />
            {memory.created_at && (
              <Typography variant="caption" sx={{ color: '#777' }}>
                Created: {format(new Date(memory.created_at), 'PPpp')}
              </Typography>
            )}
            {memory.updated_at && memory.updated_at !== memory.created_at && (
              <Typography variant="caption" sx={{ color: '#777' }}>
                • Updated: {format(new Date(memory.updated_at), 'PPpp')}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
