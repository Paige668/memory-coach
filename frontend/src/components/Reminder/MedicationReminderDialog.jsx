import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography,
  IconButton, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, Grid, InputAdornment
} from '@mui/material'
import { Close as CloseIcon, Medication as MedicationIcon } from '@mui/icons-material'
import { useReminders } from '../../context/ReminderContext'
import api from '../../services/api'

const MedicationReminderDialog = ({ open, onClose, onSuccess, reminderToEdit, initialReminder }) => {
  const { createReminder, updateReminder } = useReminders()
  const [drugName, setDrugName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [timing, setTiming] = useState('')
  const [date, setDate] = useState(() => {
    const now = new Date()
    const futureTime = new Date(now.getTime() + 60 * 60 * 1000) // Add 1 hour
    return futureTime.toISOString().split('T')[0]
  })
  const [time, setTime] = useState(() => {
    const now = new Date()
    const futureTime = new Date(now.getTime() + 60 * 60 * 1000) // Add 1 hour
    return `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`
  })
  const [repeatRule, setRepeatRule] = useState('NONE')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = (reminderToEdit && reminderToEdit.rid) || (initialReminder && initialReminder.rid)

  // Pre-fill form when editing
  useEffect(() => {
    const reminder = reminderToEdit || initialReminder
    if (isEditing && reminder) {
      try {
        const info = JSON.parse(reminder.description || '{}')
        setDrugName(info.drugName || '')
        // Extract number from quantity string like "2 tablets" or "1 tablet"
        const quantityMatch = info.quantity ? info.quantity.match(/\d+/) : null
        setQuantity(quantityMatch ? parseInt(quantityMatch[0]) : 1)
        setTiming(info.timing || '')
        setRepeatRule(reminder.repeat_rule || 'NONE')
        
        const scheduledDate = new Date(reminder.scheduled_at)
        setDate(scheduledDate.toISOString().split('T')[0])
        setTime(`${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`)
      } catch (error) {
        console.error('Failed to parse reminder data:', error)
      }
    } else {
      // Reset form for new reminder
      setDrugName('')
      setQuantity(1)
      setTiming('')
      // Set future time for new reminder (current time + 1 hour)
      const now = new Date()
      const futureTime = new Date(now.getTime() + 60 * 60 * 1000) // Add 1 hour
      setDate(futureTime.toISOString().split('T')[0])
      setTime(`${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`)
      setRepeatRule('NONE')
    }
    setError(null)
  }, [isEditing, reminderToEdit, initialReminder, open])

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null)
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!drugName.trim()) {
      setError('Please enter drug name')
      return
    }
    if (!quantity || Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }
    if (!timing) {
      setError('Please select timing instruction')
      return
    }
    if (!date) {
      setError('Please select date')
      return
    }
    if (!time) {
      setError('Please select time')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const medicationInfo = {
      drugName: drugName.trim(),
      quantity: `${quantity} ${quantity === 1 ? 'tablet' : 'tablets'}`,
      timing: timing
    }

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

    const reminder = reminderToEdit || initialReminder
    const apiEndpoint = isEditing ? `/api/update_reminder/${reminder.rid}` : '/api/create_reminder'
    const httpMethod = isEditing ? 'PATCH' : 'POST'

    try {
      const requestData = {
        title: 'Medication Reminder',
        description: JSON.stringify(medicationInfo),
        scheduled_at: scheduledAt,
        repeat_rule: repeatRule,
        repeat_interval: 1,
        channels: ['alarm'],
        reminder_type: 'medication',
        is_active: true,
      }

      if (isEditing) {
        await updateReminder(reminder.rid, requestData)
      } else {
        await createReminder(requestData)
      }

      console.log('Medication reminder saved successfully')
      if (onSuccess) {
        onSuccess()
      }
      handleClose()
    } catch (err) {
      console.error('Error creating medication reminder:', err)
      setError(err.message || 'Failed to create medication reminder')
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
          borderRadius: 3,
          overflow: 'hidden',
        }
      }}
    >
      {/* Header with green background */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
        color: 'white',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicationIcon sx={{ color: 'white', fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, fontSize: '1.4rem' }}>
{isEditing ? 'Edit Medication Reminder' : 'Create Medication Reminder'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Drug Name Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#333', fontSize: '1.2rem' }}>
            Drug Name
          </Typography>
          <TextField
            fullWidth
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            placeholder="e.g., Aspirin"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1.3rem',
                py: 1.5
              }
            }}
          />
        </Box>

        {/* Dosage and Timing Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#333', fontSize: '1.2rem' }}>
            Dosage & Timing
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Dosage"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="2"
              variant="outlined"
              sx={{ flex: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">tablets</InputAdornment>,
              }}
            />
            <FormControl sx={{ flex: 1 }} variant="outlined">
              <InputLabel>Timing</InputLabel>
              <Select
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                label="Timing"
              >
                <MenuItem value="Before meals">Before meals</MenuItem>
                <MenuItem value="With meals">With meals</MenuItem>
                <MenuItem value="After meals">After meals</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* When Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#333', fontSize: '1.2rem' }}>
            When?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        {/* Repeat Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#333', fontSize: '1.2rem' }}>
            Repeat Settings
          </Typography>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Repeat</InputLabel>
            <Select
              value={repeatRule}
              onChange={(e) => setRepeatRule(e.target.value)}
              label="Repeat"
            >
              <MenuItem value="NONE">No repeat</MenuItem>
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting} sx={{ fontSize: '1.1rem' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <MedicationIcon />}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              color: 'white',
              borderRadius: 2,
              px: 3,
              py: 1,
              fontSize: '1.1rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #5cb85c 100%)',
              }
            }}
          >
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Reminder' : 'Create Reminder')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default MedicationReminderDialog