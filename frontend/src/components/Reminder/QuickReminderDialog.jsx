import React, { useState, useEffect } from 'react'
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
  Alert,
  CircularProgress,
} from '@mui/material'
import { Close as CloseIcon, Alarm as AlarmIcon } from '@mui/icons-material'
import { useReminders } from '../../context/ReminderContext'
import api from '../../services/api'

const QuickReminderDialog = ({ open, onClose, onSuccess, reminderToEdit }) => {
  const { createReminder, updateReminder } = useReminders()
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = reminderToEdit && reminderToEdit.rid

  // Pre-fill form when editing or set current time for new reminder
  useEffect(() => {
    if (isEditing && reminderToEdit) {
      setDescription(reminderToEdit.title || reminderToEdit.description || '')
      const scheduledDate = new Date(reminderToEdit.scheduled_at)
      setDate(scheduledDate.toISOString().split('T')[0])
      setTime(`${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`)
    } else if (open) {
      // Set future time for new reminder (current time + 1 hour) when dialog opens
      const now = new Date()
      const futureTime = new Date(now.getTime() + 60 * 60 * 1000) // Add 1 hour
      setDate(futureTime.toISOString().split('T')[0])
      setTime(`${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`)
      setDescription('')
    } else {
      // Reset form when dialog closes
      setDescription('')
      setDate('')
      setTime('')
    }
    setError(null)
  }, [isEditing, reminderToEdit, open])

  const handleClose = () => {
    setDescription('')
    setDate('')
    setTime('')
    setError(null)
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async () => {
    try {
      if (!description.trim()) {
        setError('Please enter a reminder description')
        return
      }
      if (!date) {
        setError('Please select a date')
        return
      }
      if (!time) {
        setError('Please select a time')
        return
      }

      setIsSubmitting(true)
      setError(null)

      // Build scheduled time - maintain local time, no UTC conversion
      const localDate = new Date(`${date}T${time}`)
      // Create local time string, avoid timezone conversion
      const year = localDate.getFullYear()
      const month = String(localDate.getMonth() + 1).padStart(2, '0')
      const day = String(localDate.getDate()).padStart(2, '0')
      const hours = String(localDate.getHours()).padStart(2, '0')
      const minutes = String(localDate.getMinutes()).padStart(2, '0')
      const scheduledAt = `${year}-${month}-${day}T${hours}:${minutes}:00`
      console.log('Date:', date, 'Time:', time, 'ScheduledAt:', scheduledAt)

      // Call API
      const requestData = {
        title: description.trim(),
        description: description.trim(),
        scheduled_at: scheduledAt,
        repeat_rule: 'NONE',
        repeat_interval: 1,
        channels: ['alarm'],
        reminder_type: 'general',
        is_active: true,
      }

      if (isEditing) {
        await updateReminder(reminderToEdit.rid, requestData)
      } else {
        await createReminder(requestData)
      }

      console.log('Reminder created successfully')
      if (onSuccess) {
        onSuccess()
      }
      handleClose()
    } catch (err) {
      console.error('Error creating reminder:', err)
      setError(err.message || 'Failed to create reminder')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <AlarmIcon sx={{ fontSize: 36, color: '#FFFFFF' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1.5rem' }}>
              {isEditing ? 'Edit Reminder' : 'Quick Reminder'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: '#FFFFFF' }}>
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

        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#2C2C2C', fontSize: '1.2rem' }}>
            What to remind?
          </Typography>
          <TextField
            fullWidth
            placeholder="e.g., Take morning medicine, Doctor appointment..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                fontSize: '1.2rem',
                py: 1
              }
            }}
          />
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#2C2C2C', fontSize: '1.2rem' }}>
            When?
          </Typography>
          <Box display="flex" gap={2}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                }
              }}
            />
            <TextField
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#FFFFFF', p: 3, borderRadius: '0 0 16px 16px' }}>
        <Button 
          onClick={handleClose} 
          disabled={isSubmitting}
          sx={{
            color: '#666666',
            textTransform: 'none',
            fontSize: '1.1rem',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)',
            color: '#FFFFFF',
            textTransform: 'none',
            fontSize: '1.1rem',
            fontWeight: 600,
            px: 4,
            borderRadius: '12px',
            '&:hover': {
              background: 'linear-gradient(135deg, #FFB300 0%, #FFCA28 100%)',
            }
          }}
        >
          {isSubmitting ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : (isEditing ? 'Update Reminder' : 'Create Reminder')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickReminderDialog

