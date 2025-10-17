import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Medication as MedicationIcon,
  Alarm as AlarmIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material'
import MedicationReminderDialog from '../../components/Reminder/MedicationReminderDialog'
import QuickReminderDialog from '../../components/Reminder/QuickReminderDialog'
import { useReminders } from '../../context/ReminderContext'
import api from '../../services/api'

const RemindersManagement = () => {
  console.log('🎭 RemindersManagement component rendering...')
  const { reminders, loading, error, deleteReminder, getUpcomingReminders } = useReminders()
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false)
  const [quickReminderDialogOpen, setQuickReminderDialogOpen] = useState(false)
  const [displayDialogOpen, setDisplayDialogOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState(null)
  const [quickReminderToEdit, setQuickReminderToEdit] = useState(null) // For editing general reminders

  // Handle reminder display
  const handleReminderClick = (reminder) => {
    if (reminder.reminder_type === 'medication') {
      setSelectedReminder(reminder)
      setDisplayDialogOpen(true)
    }
  }


  // Handle reminder deletion
  const handleDeleteReminder = async (reminderId) => {
    try {
      await deleteReminder(reminderId)
    } catch (err) {
      console.error('Error deleting reminder:', err)
    }
  }


  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get comparable Date from reminder
  const getReminderDate = (reminder) => {
    const src = reminder?.next_run_at || reminder?.scheduled_at
    return src ? new Date(src) : null
  }

  // Sort reminders: upcoming soonest first, then past (most recent past first)
  const sortedReminders = (() => {
    const now = new Date()
    const withDate = reminders
      .map(r => ({ r, d: getReminderDate(r) }))
      .filter(item => item.d instanceof Date && !isNaN(item.d))

    const upcoming = withDate
      .filter(item => item.d >= now)
      .sort((a, b) => a.d - b.d)

    const past = withDate
      .filter(item => item.d < now)
      .sort((a, b) => b.d - a.d)

    return [...upcoming, ...past].map(item => item.r)
  })()

  // Get reminder type color
  const getReminderTypeColor = (type) => {
    switch (type) {
      case 'medication': return 'success'
      case 'general': return 'warning'
      default: return 'default'
    }
  }

  // Get reminder type text
  const getReminderTypeText = (type) => {
    switch (type) {
      case 'medication': return 'Medication'
      case 'general': return 'General'
      default: return 'Unknown'
    }
  }

  // Get reminder status
  const getReminderStatus = (reminder) => {
    // If user has acknowledged the reminder, it's completed
    if (reminder.last_sent_at) {
      return { text: 'Completed', color: '#2196F3' }
    }
    
    const now = new Date()
    const scheduledTime = new Date(reminder.next_run_at || reminder.scheduled_at)
    
    // If time has passed but not acknowledged, it's overdue
    if (scheduledTime <= now) {
      return { text: 'Overdue', color: '#FF5722' }
    }
    
    return { text: 'Active', color: '#9C27B0' }
  }

  // Parse medication info for display
  const parseMedicationInfo = (description) => {
    try {
      return JSON.parse(description)
    } catch {
      return null
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

  // Get timing text in English
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
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(255, 193, 7, 0.05) 100%)',
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
              background: 'linear-gradient(135deg, #4CAF50 0%, #FFC107 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              textAlign: 'center',
              mb: 2,
              textShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            Manage medication and general reminders
          </Typography>
          
          {/* Decorative line */}
          <Box sx={{
            width: 100,
            height: 4,
            background: 'linear-gradient(135deg, #4CAF50 0%, #FFC107 100%)',
            borderRadius: 2,
            mx: 'auto',
            mb: 2
          }} />
          
        </Box>
      </Box>
      

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}


      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Card 
            sx={{ 
              height: 250,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: '#4CAF50',
              borderRadius: 3,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              }
            }}
            onClick={() => setMedicationDialogOpen(true)}
          >
            <CardContent sx={{ py: 4, px: 5, display: 'flex', alignItems: 'center', height: '100%' }}>
              {/* Left icon */}
              <Box sx={{
                width: 96,
                height: 96,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 4,
                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)'
              }}>
                <MedicationIcon sx={{ fontSize: 64, color: 'white' }} />
              </Box>
              {/* Right text */}
              <Box sx={{ color: 'white', flex: 1, minWidth: 0 }}>
                <Typography component="h2" sx={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.02em', mb: 1 }}>
                  Medication Reminder
                </Typography>
                <Typography sx={{ fontSize: '1.1rem', opacity: 0.95 }}>
                  Set medication reminders with dosage and timing
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Card 
            sx={{ 
              height: 250,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: '#FFC107',
              borderRadius: 3,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              }
            }}
            onClick={() => setQuickReminderDialogOpen(true)}
          >
            <CardContent sx={{ py: 4, px: 5, display: 'flex', alignItems: 'center', height: '100%' }}>
              {/* Left icon */}
              <Box sx={{
                width: 96,
                height: 96,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 4,
                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)'
              }}>
                <AlarmIcon sx={{ fontSize: 64, color: 'white' }} />
              </Box>
              {/* Right text */}
              <Box sx={{ color: 'white', flex: 1, minWidth: 0 }}>
                <Typography component="h2" sx={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.02em', mb: 1 }}>
                  Quick Reminder
                </Typography>
                <Typography sx={{ fontSize: '1.1rem', opacity: 0.95 }}>
                  Set general reminders for events and tasks
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Reminders List */}
      <Card>
        <CardContent>
          {/* Enhanced Header Section */}
          <Box sx={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            borderRadius: 3,
            p: 3,
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #E0E0E0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(255, 193, 7, 0.03) 100%)',
              pointerEvents: 'none'
            }
          }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                  border: '1px solid rgba(76, 175, 80, 0.2)'
                }}>
                  <AlarmIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 800,
                      color: '#2C2C2C',
                      fontSize: '2rem',
                      letterSpacing: '-0.02em',
                      mb: 0.5
                    }}
                  >
                    Your Reminders
                  </Typography>
                </Box>
              </Box>
              
              {/* Stats Row */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3, 
                mt: 2,
                flexWrap: 'wrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)'
                  }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666666',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    {reminders.filter(r => r.reminder_type === 'medication').length} Medication
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#FFC107',
                    boxShadow: '0 0 8px rgba(255, 193, 7, 0.6)'
                  }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666666',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    {reminders.filter(r => r.reminder_type === 'general').length} General
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: getUpcomingReminders().length > 0 ? '#9C27B0' : '#9E9E9E',
                    boxShadow: getUpcomingReminders().length > 0
                      ? '0 0 8px rgba(156, 39, 176, 0.6)'
                      : '0 0 8px rgba(158, 158, 158, 0.6)'
                  }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666666',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    {getUpcomingReminders().length} Active
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : reminders.length === 0 ? (
            <Box textAlign="center" py={4}>
              <AlarmIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reminders yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first reminder using the options above
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRadius: 3,
              border: '1px solid #E0E0E0',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              {sortedReminders.map((reminder, index) => {
                const medicationInfo = reminder.reminder_type === 'medication' 
                  ? parseMedicationInfo(reminder.description) 
                  : null

                const isMedication = reminder.reminder_type === 'medication'
                const isGeneral = reminder.reminder_type === 'general'

                return (
                  <React.Fragment key={reminder.rid}>
                    <Box
                      sx={{ 
                        p: 3,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        cursor: isMedication ? 'pointer' : 'default',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        background: isMedication 
                          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(76, 175, 80, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 193, 7, 0.02) 0%, rgba(255, 193, 7, 0.05) 100%)',
                        '&:hover': {
                          backgroundColor: isMedication 
                            ? 'rgba(76, 175, 80, 0.08)' 
                            : 'rgba(255, 193, 7, 0.08)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          background: isMedication 
                            ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'
                            : 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)',
                          borderRadius: '0 2px 2px 0'
                        }
                      }}
                      onClick={() => handleReminderClick(reminder)}
                    >
                      {/* Left side - Main content */}
                      <Box sx={{ flex: 1, minWidth: 0, ml: 2 }}>
                        {/* Icon and Title Row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: isMedication 
                              ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'
                              : 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'all 0.3s ease'
                          }}>
                            {isMedication ? (
                              <MedicationIcon sx={{ color: 'white', fontSize: 20 }} />
                            ) : (
                              <AlarmIcon sx={{ color: 'white', fontSize: 20 }} />
                            )}
                          </Box>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="h6" 
                              component="h3"
                              sx={{ 
                                fontWeight: 700,
                                color: '#2C2C2C',
                                fontSize: '1.5rem',
                                mb: 0.5,
                                background: 'linear-gradient(135deg, #2C2C2C 0%, #424242 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              {isMedication && medicationInfo
                                ? `${convertToEnglish(medicationInfo.drugName, 'drugName')}`
                                : reminder.title}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Chip 
                              label={getReminderTypeText(reminder.reminder_type)}
                                sx={{
                                  backgroundColor: isGeneral ? '#FFC107' : undefined,
                                  color: isGeneral ? '#FFFFFF' : undefined,
                                  fontSize: '1rem',
                                  height: 32,
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  '& .MuiChip-label': {
                                    color: isGeneral ? '#FFFFFF' : undefined,
                                    px: 1.5
                                  }
                                }}
                                color={isGeneral ? undefined : getReminderTypeColor(reminder.reminder_type)}
                              size="small"
                            />
                              
                              {/* Status indicator */}
                              {(() => {
                                const status = getReminderStatus(reminder)
                                return (
                                  <>
                                    <Box sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      backgroundColor: status.color,
                                      boxShadow: `0 0 8px ${status.color}60`
                                    }} />
                                    
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: status.color,
                                        fontWeight: 600,
                                        fontSize: '1.0rem'
                                      }}
                                    >
                                      {status.text}
                                    </Typography>
                                  </>
                                )
                              })()}
                            </Box>
                          </Box>
                        </Box>

                        {/* Details */}
                        <Box sx={{ ml: 6 }}>
                            {medicationInfo && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#666666',
                                mb: 0.5,
                                fontSize: '1.1rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              💊 {convertToEnglish(medicationInfo.quantity, 'quantity')} ({getTimingText(medicationInfo.timing)})
                              </Typography>
                            )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#666666',
                              fontSize: '1.1rem',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mb: reminder.repeat_rule && reminder.repeat_rule !== 'NONE' ? 0.5 : 0
                            }}
                          >
                            🕒 {formatDate(reminder.scheduled_at)}
                          </Typography>
                          {reminder.repeat_rule && reminder.repeat_rule !== 'NONE' && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#666666',
                                fontSize: '1.1rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              🔄 Repeats: {reminder.repeat_rule}
                              </Typography>
                            )}
                          </Box>
                      </Box>

                      {/* Right side - Action buttons */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        ml: 2,
                        opacity: 0.7,
                        transition: 'opacity 0.3s ease'
                      }}>
                          <IconButton
                          size="small"
                            aria-label="edit reminder"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (reminder.reminder_type === 'medication') {
                                setSelectedReminder(reminder)
                                setMedicationDialogOpen(true)
                              } else if (reminder.reminder_type === 'general') {
                                setQuickReminderToEdit(reminder)
                                setQuickReminderDialogOpen(true)
                              }
                            }}
                          sx={{ 
                            color: '#9E9E9E',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': { 
                              color: '#1976D2',
                              backgroundColor: 'rgba(25, 118, 210, 0.1)',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                            }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>

                          <IconButton 
                          size="small"
                          aria-label="delete reminder"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteReminder(reminder.rid)
                            }}
                            sx={{ 
                            color: '#9E9E9E',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': { 
                              color: '#D32F2F',
                              backgroundColor: 'rgba(211, 47, 47, 0.1)',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                    </Box>
                    {index < sortedReminders.length - 1 && (
                      <Box sx={{ 
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent 0%, #E0E0E0 50%, transparent 100%)',
                        mx: 3
                      }} />
                    )}
                  </React.Fragment>
                )
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Medication Reminder Dialog */}
      <MedicationReminderDialog
        open={medicationDialogOpen}
        onClose={() => { setMedicationDialogOpen(false); setSelectedReminder(null) }}
        onSuccess={() => { setMedicationDialogOpen(false); setSelectedReminder(null) }}
        initialReminder={selectedReminder && selectedReminder.reminder_type === 'medication' ? selectedReminder : null}
      />

      {/* Quick Reminder Dialog */}
      <QuickReminderDialog
        open={quickReminderDialogOpen}
        onClose={() => {
          setQuickReminderDialogOpen(false)
          setQuickReminderToEdit(null)
        }}
        onSuccess={() => {
          setQuickReminderDialogOpen(false)
          setQuickReminderToEdit(null)
        }}
        reminderToEdit={quickReminderToEdit}
      />

    </Box>
  )
}

export default RemindersManagement
