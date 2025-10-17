import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useMemory } from '../../context/MemoryContext'

const EditMemoryCardDialog = ({ open, onClose, memory }) => {
  const { updateMemory, memories } = useMemory()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load memory data when dialog opens
  useEffect(() => {
    if (open && memory) {
      setTitle(memory.title || '')
      setContent(memory.content || '')
      setTags(memory.tags || [])
      setError(null)
    }
  }, [open, memory])

  // Handle tag addition
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // Build unique list of existing tags from all memories for dropdown options
  const availableTags = useMemo(() => {
    const set = new Set()
    ;(memories || []).forEach(m => {
      ;(m?.tags || []).forEach(t => {
        if (typeof t === 'string' && t.trim()) set.add(t)
      })
    })
    return Array.from(set).sort()
  }, [memories])

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!content.trim()) {
        setError('Please provide content')
        return
      }

      setIsSubmitting(true)

      const generateAutoTitle = (text) => {
        const t = (text || '').trim().replace(/\s+/g, ' ')
        if (t.length > 0) {
          return t.slice(0, 30)
        }
        return new Date().toLocaleString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      }

      const effectiveTitle = title.trim() || generateAutoTitle(content)

      const updatedData = {
        title: effectiveTitle,
        content: content.trim(),
        tags: tags,
      }

      console.log('Updating memory:', memory.id, updatedData)
      await updateMemory(memory.id, updatedData)
      console.log('Memory updated successfully')

      // Close dialog
      setIsSubmitting(false)
      onClose()
    } catch (error) {
      console.error('Error updating memory:', error)
      setError(error.message || 'Failed to update memory card')
      setIsSubmitting(false)
    }
  }

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('')
      setContent('')
      setTags([])
      setNewTag('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '500px',
          borderRadius: '20px',
          background: 'linear-gradient(90deg, #7E57C2 0%, #7E57C2 88%, #9575CD 100%)'
        }
      }}
    >
      <DialogTitle sx={{ color: '#FFFFFF', pb: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' } }}>
            Edit Memory Card
          </Typography>
          <IconButton onClick={handleClose} disabled={isSubmitting} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#FFFFFF', mt: 2, borderRadius: '16px 16px 0 0' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Title Heading */}
        <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }, fontWeight: 800, mb: 1 }}>
          Title
        </Typography>
        <TextField
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          placeholder="Enter a title for your memory..."
          disabled={isSubmitting}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': { borderColor: '#B39DDB', borderWidth: 2 },
              '&:hover fieldset': { borderColor: '#9575CD' },
              '&.Mui-focused fieldset': { borderColor: '#9575CD', borderWidth: 2 },
            },
            '& .MuiInputBase-input': {
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
              padding: { xs: '14px', sm: '16px', md: '18px' }
            }
          }}
        />

        {/* Content Heading */}
        <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }, fontWeight: 800, mt: 3, mb: 1 }}>
          Content
        </Typography>
        <TextField
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          margin="normal"
          multiline
          rows={8}
          placeholder="Write your memory here..."
          disabled={isSubmitting}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': { borderColor: '#B39DDB', borderWidth: 2 },
              '&:hover fieldset': { borderColor: '#9575CD' },
              '&.Mui-focused fieldset': { borderColor: '#9575CD', borderWidth: 2 },
            },
            '& .MuiInputBase-input': {
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
              padding: { xs: '14px', sm: '16px', md: '18px' }
            }
          }}
        />

        {/* Tags */}
        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }, fontWeight: 700 }}>
            Tags
          </Typography>
          
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                color="primary"
                variant="outlined"
                disabled={isSubmitting}
              />
            ))}
          </Box>

          <Box display="flex" gap={1}>
            <FormControl size="small" sx={{ minWidth: 220 }} disabled={isSubmitting}>
              <InputLabel id="select-existing-tag-label">Add Tag</InputLabel>
              <Select
                labelId="select-existing-tag-label"
                label="Add Tag"
                value={newTag}
                onChange={(e) => {
                  const value = e.target.value
                  setNewTag(value)
                  if (value && !tags.includes(value)) {
                    setTags([...tags, value])
                  }
                  setNewTag('')
                }}
              >
                {availableTags.length === 0 && (
                  <MenuItem value="" disabled>No existing tags</MenuItem>
                )}
                {availableTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Created/Updated Info */}
        {memory && (
          <Box mt={3}>
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(memory.created_at).toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
            {memory.updated_at && memory.updated_at !== memory.created_at && (
              <Typography variant="caption" color="text.secondary" display="block">
                Last updated: {new Date(memory.updated_at).toLocaleString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#FFFFFF', p: 3, borderRadius: '0 0 16px 16px' }}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={{ color: '#666666' }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #7E57C2 0%, #9575CD 100%)',
            color: '#FFFFFF',
            fontWeight: 600,
            px: 4,
            borderRadius: '12px',
            '&:hover': { background: 'linear-gradient(135deg, #6A3EB9 0%, #8C6CCF 100%)' }
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditMemoryCardDialog

