import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import { 
  Medication as MedicationIcon, 
  Alarm as AlarmIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material'

const MedicationReminderDisplay = ({ reminder, open, onClose, onAcknowledge }) => {
  const [medicationInfo, setMedicationInfo] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [soundInterval, setSoundInterval] = useState(null)
  const [isAcknowledging, setIsAcknowledging] = useState(false)

  // Debug logging
  console.log('🎭 MedicationReminderDisplay render:', { 
    open, 
    reminder: reminder ? { rid: reminder.rid, title: reminder.title } : null,
    medicationInfo,
    isAcknowledging
  })

  useEffect(() => {
    if (reminder && reminder.description) {
      if (reminder.reminder_type === 'medication') {
        try {
          const info = JSON.parse(reminder.description)
          setMedicationInfo(info)
        } catch (error) {
          console.error('Failed to parse medication info:', error)
          setMedicationInfo({
            drugName: 'Unknown drug',
            quantity: 'Unknown quantity',
            timing: 'Unknown timing'
          })
        }
      } else {
        // For general reminders, create a simple info object
        setMedicationInfo({
          drugName: reminder.title || 'General Reminder',
          quantity: 'Reminder',
          timing: 'Now'
        })
      }
    }
  }, [reminder])

  useEffect(() => {
    if (open && medicationInfo) {
      // Start continuous reminder sound
      startContinuousSound()
    } else {
      // Stop playing
      stopContinuousSound()
    }
  }, [open, medicationInfo])

  // Clean up timer
  useEffect(() => {
    return () => {
      if (soundInterval) {
        clearInterval(soundInterval)
      }
    }
  }, [soundInterval])

  // Start continuous sound playback
  const startContinuousSound = () => {
    setIsPlaying(true)
    console.log('Starting continuous reminder sound...')
    
    // Play immediately once
    playReminderSound()
    
    // Repeat every 2 seconds
    const interval = setInterval(() => {
      playReminderSound()
    }, 2000)
    
    setSoundInterval(interval)
  }

  // Stop continuous sound playback
  const stopContinuousSound = () => {
    console.log('Stopping continuous reminder sound...')
    setIsPlaying(false)
    if (soundInterval) {
      clearInterval(soundInterval)
      setSoundInterval(null)
    }
  }

  const playReminderSound = async () => {
    try {
      // Use Web Audio API to play reminder sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      
      // Create simple reminder sound (two tones)
      const playTone = (frequency, duration, delay = 0) => {
        setTimeout(() => {
          try {
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
            oscillator.type = 'sine'
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + duration)
            console.log(`Playing tone: ${frequency}Hz`)
          } catch (toneError) {
            console.error('Error playing tone:', toneError)
          }
        }, delay)
      }

      // Play reminder sound sequence
      playTone(800, 0.3, 0)    // First tone
      playTone(1000, 0.3, 400) // Second tone
      playTone(800, 0.3, 800)  // Third tone
      
    } catch (error) {
      console.error('Failed to play reminder sound:', error)
    }
  }

  const handleAcknowledge = async () => {
    if (isAcknowledging) {
      console.log('⚠️ Already acknowledging, skipping...')
      return
    }
    
    try {
      setIsAcknowledging(true)
      console.log('✅ Acknowledging reminder:', reminder.rid)
      
      // Stop sound playback
      stopContinuousSound()
      
      if (onAcknowledge) {
        await onAcknowledge(reminder.rid)
      }
      
      // Ensure dialog closes
      onClose()
      console.log('✅ Reminder acknowledged and dialog closed')
    } catch (error) {
      console.error('Failed to acknowledge reminder:', error)
    } finally {
      setIsAcknowledging(false)
    }
  }

  const handleClose = () => {
    console.log('❌ Closing reminder dialog:', reminder?.rid)
    // Stop sound playback
    stopContinuousSound()
    
    // Close directly without calling confirm function (avoid duplicate calls)
    onClose()
    console.log('✅ Dialog closed')
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    // Use local time for display to match user's timezone
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }

  const getTimingColor = (timing) => {
    switch (timing) {
      case 'Before meals': return 'warning'
      case 'With meals': return 'info'
      case 'After meals': return 'success'
      default: return 'default'
    }
  }

  const getTimingText = (timing) => {
    switch (timing) {
      case 'Before meals': return 'Before meals'
      case 'With meals': return 'With meals'
      case 'After meals': return 'After meals'
      case '饭前': return 'Before meals'
      case '饭中': return 'With meals'
      case '饭后': return 'After meals'
      default: return timing
    }
  }

  // Helper function to detect Chinese characters
  const containsChinese = (text) => {
    return /[\u4e00-\u9fa5]/.test(text)
  }

  // Convert Chinese text to English placeholder
  const convertToEnglish = (text, type) => {
    if (!text || !containsChinese(text)) {
      return text
    }
    
    switch (type) {
      case 'drugName':
        return 'Medication'
      case 'quantity':
        return 'Dosage'
      default:
        return text
    }
  }

  if (!medicationInfo) {
    return null
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
          background: reminder?.reminder_type === 'medication' 
            ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' 
            : 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)',
          color: 'white',
          minHeight: '400px',
        }
      }}
    >
      <DialogContent sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Close button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <IconButton 
            onClick={handleClose} 
            sx={{ color: 'white', opacity: 0.8 }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Main Title - Reduce proportion */}
        <Box sx={{ mb: 1, flex: '0 0 auto' }}>
          {reminder?.reminder_type === 'medication' ? (
            <MedicationIcon sx={{ fontSize: 32, mb: 0.5, opacity: 0.9 }} />
          ) : (
            <AlarmIcon sx={{ fontSize: 32, mb: 0.5, opacity: 0.9 }} />
          )}
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600, mb: 0.25, fontSize: '1.2rem' }}>
            {reminder?.reminder_type === 'medication' ? 'Medication Reminder' : 'General Reminder'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
            {formatTime(reminder?.scheduled_at)}
          </Typography>
        </Box>

        {/* Medication Info Card - Increase proportion */}
        <Card sx={{ 
          mb: 2, 
          flex: '1 1 auto',
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CardContent sx={{ p: 3, flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {reminder?.reminder_type === 'medication' ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, fontSize: '1.1rem' }}>
                    Drug Name
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2.2rem' }}>
                    {convertToEnglish(medicationInfo.drugName, 'drugName')}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, fontSize: '1.1rem' }}>
                    Dosage Quantity
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2.2rem' }}>
                    {convertToEnglish(medicationInfo.quantity, 'quantity')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, fontSize: '1.1rem' }}>
                    Timing Instruction
                  </Typography>
                  <Chip 
                    label={getTimingText(medicationInfo.timing)}
                    color={getTimingColor(medicationInfo.timing)}
                    sx={{ 
                      fontSize: '1.3rem',
                      height: '50px',
                      fontWeight: 700,
                      px: 2,
                      '& .MuiChip-label': {
                        color: 'white'
                      }
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, fontSize: '1.1rem' }}>
                  Reminder
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2.2rem' }}>
                  {medicationInfo.drugName}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>


        {/* Acknowledge Button (more prominent) */}
        <Button
          variant="contained"
          size="large"
          onClick={handleAcknowledge}
          startIcon={<CheckCircleIcon sx={{ fontSize: 36 }} />}
          sx={{
            flex: '0 0 auto',
            alignSelf: 'center',
            minWidth: 320,
            background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            letterSpacing: '1px',
            fontSize: '1.8rem',
            py: 3,
            px: 6,
            borderRadius: 999,
            boxShadow: '0 20px 40px rgba(255, 87, 34, 0.4), 0 0 0 6px rgba(255, 255, 255, 0.3) inset, 0 0 20px rgba(255, 87, 34, 0.6)',
            textTransform: 'none',
            transition: 'all 0.3s ease',
            animation: 'pulse 2s infinite',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
              borderRadius: 999,
              zIndex: -1,
              opacity: 0.3,
              animation: 'pulse-ring 2s infinite'
            },
            '&:hover': {
              transform: 'translateY(-4px) scale(1.05)',
              boxShadow: '0 25px 50px rgba(255, 87, 34, 0.5), 0 0 0 8px rgba(255, 255, 255, 0.4) inset, 0 0 30px rgba(255, 87, 34, 0.8)',
              background: 'linear-gradient(135deg, #E64A19 0%, #FF5722 100%)'
            },
            '&:active': {
              transform: 'translateY(-2px) scale(1.02)'
            },
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 20px 40px rgba(255, 87, 34, 0.4), 0 0 0 6px rgba(255, 255, 255, 0.3) inset, 0 0 20px rgba(255, 87, 34, 0.6)'
              },
              '50%': {
                boxShadow: '0 25px 50px rgba(255, 87, 34, 0.6), 0 0 0 8px rgba(255, 255, 255, 0.4) inset, 0 0 30px rgba(255, 87, 34, 0.8)'
              },
              '100%': {
                boxShadow: '0 20px 40px rgba(255, 87, 34, 0.4), 0 0 0 6px rgba(255, 255, 255, 0.3) inset, 0 0 20px rgba(255, 87, 34, 0.6)'
              }
            },
            '@keyframes pulse-ring': {
              '0%': {
                transform: 'scale(1)',
                opacity: 0.3
              },
              '50%': {
                transform: 'scale(1.1)',
                opacity: 0.1
              },
              '100%': {
                transform: 'scale(1.2)',
                opacity: 0
              }
            }
          }}
        >
          GOT IT
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default MedicationReminderDisplay
