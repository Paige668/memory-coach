import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import {
  Add as AddIcon,
  Memory as MemoryIcon,
  Alarm as AlarmIcon,
  Today as TodayIcon,
  Medication as MedicationIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useMemory } from '../../context/MemoryContext'
import { useReminders } from '../../context/ReminderContext'
import QuickReminderSelectionDialog from '../../components/Reminder/QuickReminderSelectionDialog'
import MemoryCard from '../../components/MemoryCard/MemoryCard'
import CreateMemoryCardDialog from '../../components/MemoryCard/CreateMemoryCardDialog'
import EditMemoryCardDialog from '../../components/MemoryCard/EditMemoryCardDialog'
import ViewMemoryCardDialog from '../../components/MemoryCard/ViewMemoryCardDialog'
import api from '../../services/api'

import heroBg from './hero-care.jpg';


const Dashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { memories, loading, deleteMemory, error } = useMemory()
  const { reminders, getUpcomingReminders } = useReminders()
  
  // Debug: Log memory state
  console.log('🎯 Dashboard - Memory state:', { memories, loading, error })
  const [quickReminderSelectionDialogOpen, setQuickReminderSelectionDialogOpen] = useState(false)
  const [createMemoryDialogOpen, setCreateMemoryDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memoryToDelete, setMemoryToDelete] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [memoryToEdit, setMemoryToEdit] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [memoryToView, setMemoryToView] = useState(null)


  // Format time display
  const formatTimeDisplay = (dateString) => {
    if (!dateString) return 'No time set'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date - now
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.ceil(diffMs / (1000 * 60))
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      if (diffMinutes <= 60) {
        return diffMinutes <= 0 ? 'Now' : `In ${diffMinutes}m`
      }
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    
    // Tomorrow
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }
    
    // This week
    if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
    }
    
    // Next week
    if (diffDays <= 14) {
      return `Next ${date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`
    }
    
    // This month
    if (date.getMonth() === now.getMonth()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }
    
    // Same year - show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }
    
    // Next year or later - show year
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
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

  // Handle edit open/close
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

  // Get today's memory cards count
  const todayMemories = (memories || []).filter(memory => {
    if (!memory || !memory.created_at) return false
    const today = new Date().toDateString()
    const memoryDate = new Date(memory.created_at).toDateString()
    return today === memoryDate
  })

  // Get last 7 days memory cards count
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentMemories = (memories || []).filter(memory => {
    if (!memory || !memory.created_at) return false
    return new Date(memory.created_at) >= weekAgo
  })

  // Get upcoming reminders for display
  const upcomingReminders = getUpcomingReminders().slice(0, 3)
  
  // Parse medication details from description
  const parseMedicationDetails = (description) => {
    try {
      const parsed = JSON.parse(description)
      return {
        drugName: parsed.drugName || 'Unknown Medication',
        quantity: parsed.quantity || '',
        timing: parsed.timing || ''
      }
    } catch (error) {
      // If not JSON, treat as plain text
      return {
        drugName: description || 'Unknown Medication',
        quantity: '',
        timing: ''
      }
    }
  }

  // Format timing to English
  const formatTimingToEnglish = (timing) => {
    const timingMap = {
      'Before meals': 'Before meals',
      'After meals': 'After meals',
      'With meals': 'With meals',
      'Before bedtime': 'Before bedtime',
      'On empty stomach': 'On empty stomach',
      'In the morning': 'In the morning',
      '饭前': 'Before meals',
      '饭中': 'With meals',
      '饭后': 'After meals'
    }
    return timingMap[timing] || timing
  }

  // Create reminder cards
  const reminderCards = upcomingReminders.map((reminder, index) => {
    const isMedication = reminder.reminder_type === 'medication'
    const cardColors = [
      { bg: '#4CAF50', light: '#66BB6A' }, // Green for medication
      { bg: '#FFC107', light: '#FFD54F' }, // Yellow for general
      { bg: '#2196F3', light: '#42A5F5' }, // Blue for mixed
    ]
    const colorIndex = isMedication ? 0 : 1
    
    let title = reminder.title
    let description = reminder.description || 'No description'
    
    if (isMedication) {
      const medDetails = parseMedicationDetails(reminder.description)
      title = medDetails.drugName
      description = `${medDetails.quantity} ${formatTimingToEnglish(medDetails.timing)}`.trim()
    }
    
    return {
      reminder,
      title,
      timeDisplay: formatTimeDisplay(reminder.next_run_at),
      type: reminder.reminder_type,
      isMedication,
                      icon: isMedication ? <MedicationIcon sx={{ fontSize: 40 }} /> : <AlarmIcon sx={{ fontSize: 40 }} />,
      color: cardColors[colorIndex].bg,
      lightColor: cardColors[colorIndex].light,
      description,
      index
    }
  })

  // Fill remaining slots with empty cards if needed
  while (reminderCards.length < 3) {
    reminderCards.push({
      reminder: null,
      title: 'No upcoming reminders',
      timeDisplay: '',
      type: 'empty',
      isMedication: false,
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      color: '#E0E0E0',
      lightColor: '#F5F5F5',
      description: 'Create your first reminder',
      index: reminderCards.length,
      isEmpty: true
    })
  }

  const quickActions = [
    {
      title: 'Create Memory Card',
      description: 'Create memory cards with text or voice input',
      icon: <AddIcon sx={{ fontSize: 32 }} />,
      action: () => setCreateMemoryDialogOpen(true),
      gradient: 'linear-gradient(135deg, #8B6FAC 0%, #A98BBD 100%)',  // Purple gradient
      shadowColor: '#8B6FAC',  // Shadow color
    },
    {
      title: 'Quick Reminder',
      description: 'Set reminders for events and medications',
      icon: <AlarmIcon sx={{ fontSize: 32 }} />,
      action: () => setQuickReminderSelectionDialogOpen(true),  // Open reminder selection dialog
      gradient: 'linear-gradient(135deg, #FF9671 0%, #FFB598 100%)',  // Orange gradient
      shadowColor: '#FF9671',  // Shadow color
    },
      {
  title: 'Caregiver Quiz',
  description: '5 quick questions. Learn from mistakes via Wrong Book.',
  icon: <TodayIcon sx={{ fontSize: 32 }} />,   // TodayIcon already imported at top
  action: () => navigate('/quiz'),             // Navigate to Quiz entry page
  gradient: 'linear-gradient(135deg, #6EC1E4 0%, #9ED7F2 100%)', // Blue theme, consistent with existing style
  shadowColor: '#6EC1E4',
    },
  ]





// Education cards (English, non-blaming, practical tips)
const educationCards = [
  {
    title: "What is Alzheimer’s?",
    content:
      "Alzheimer’s is a progressive neurodegenerative condition. Memory and thinking change over time. Calm, consistent, and clear communication can help ease anxiety."
  },
  {
    title: "Global impact",
    content:
      "Over 50 million people worldwide live with Alzheimer’s or related dementias, affecting families, care systems, and public health. Early recognition and support matter."
  },
  {
    title: "What can I do?",
    content:
      "Set gentle, consistent routines and reminders; use memory cards/labels; repeat information in a calm tone instead of pointing out repeated questions; offer simple choices and step-by-step guidance; and seek community or professional support."
  }
];

// Care-oriented blue-purple
const brand = {
  purple: '#7B5FA3',
  lightPurple: '#A98BBD',
  mist: '#EEF0F7',
  heroOverlay: 'rgba(47, 36, 79, 0.50)'
}



  return(
      <Box sx={{bgcolor: '#FFF9F0'}}>

        {/* ======= HERO · Full viewport, dreamy blue-purple ======= */}
        <Box
            sx={{
              position: 'relative',
              // Fill first screen (mobile 90vh, desktop 95vh)
              minHeight: {xs: '90vh', md: '95vh'},
              borderRadius: {xs: 0, md: '32px'},
              overflow: 'hidden',
              mb: 6,
              mt: -2,
              // Background image
              backgroundImage: `url(${heroBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              // Fallback background color if image is missing (more transparent)
              backgroundColor: '#eef2ff',
            }}
        >


          {/* Gradient + glass-like overlay (enhanced blur effect, maintaining light purple gradient) */}
          <Box
              sx={{
                position: 'absolute',
                inset: 0,
                // Maintain light purple gradient tone
                background:
                    'linear-gradient(115deg, rgba(119,102,255,0.45) 0%, rgba(170,130,255,0.35) 35%, rgba(255,255,255,0.30) 100%)',
                backdropFilter: 'blur(12px) saturate(0.8)',
              }}
          />

          {/* Top navigation box (keep at top) */}
          <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 2,
                pt: {xs: 2, md: 4},
                px: {xs: 3, md: 8},
              }}
          >
            <Grid container spacing={2}>
              {educationCards.map((card, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Accordion
                        elevation={0}
                        disableGutters
                        sx={{
                          borderRadius: '16px',
                          border: '1px solid #E6E2EF',
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 2px 10px rgba(123,95,163,0.06)',
                          '&:before': {display: 'none'}
                        }}
                    >
                      <AccordionSummary
                          expandIcon={<ExpandMoreIcon/>}
                          sx={{
                            px: 2.5,
                            py: 1.5,
                            '& .MuiAccordionSummary-content': {m: 0}
                          }}
                      >
                        <Typography
                            sx={{fontWeight: 700, color: brand.purple, fontSize: '1.05rem'}}
                        >
                          {card.title}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{px: 2.5, pb: 2.5, pt: 0}}>
                        <Typography
                            sx={{color: '#4A4A4A', fontSize: '0.98rem', lineHeight: 1.7}}
                        >
                          {card.content}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
              ))}
            </Grid>
          </Box>

          {/* Main title and subtitle (moved down) */}
          <Box
              sx={{
                position: 'absolute',
                inset: 0, // Fill entire Hero area
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center', // Vertical center
                textAlign: 'center',
                pt: {xs: -12, sm: -11, md: -9}, // Larger negative value, continue moving text upward
                px: {xs: 3, md: 8},
                color: '#222', // Text color changed to dark gray-black
              }}
          >


            <Typography
                component="h1"
                sx={{
                  fontFamily: '"Lora", serif',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  fontSize: {xs: '3.8rem', sm: '4.8rem', md: '5.8rem'},
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)',
                  maxWidth: '1000px',
                  mb: 3,
                }}
            >
              Preserve precious memories with care
            </Typography>


            <Typography
                variant="h6"
                sx={{
                  fontFamily: 'sans-serif',
                  fontWeight: 400,
                  fontSize: {xs: '1.5rem', sm: '1.7rem', md: '1.9rem'},
                  color: '#F5F5F5',
                  opacity: 0.95,
                  maxWidth: '850px',
                  mt:1,
                  textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)',
                }}
            >
              We are your memory companion: memory cards,<br/>gentle reminders, and meaningful connections.
            </Typography>

          </Box>
        </Box>


        {/* Upcoming Reminders Cards */}
        <Box mb={5} mt={8}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: '2rem',
              color: '#2C2C2C',
              mb: 1,
              letterSpacing: '-0.01em',
            }}
          >
            Upcoming Reminders
          </Typography>
          <Box
            sx={{
              width: 60,
              height: 4,
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #4CAF50 0%, #FFC107 100%)',
            }}
          />
        </Box>
        
        <Grid container spacing={4} mb={6}>
          {reminderCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  bgcolor: '#FFFFFF',
                  borderRadius: '24px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: card.isEmpty ? 'pointer' : 'default',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  },
                }}
                onClick={() => {
                  if (card.isEmpty) {
                    setQuickReminderSelectionDialogOpen(true)
                  } else {
                    navigate('/reminders')
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                  {/* Left side - Main content */}
                  <Box sx={{ flex: 1 }}>
                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.4rem',
                        color: card.isEmpty ? '#999999' : '#2C2C2C',
                        mb: 1,
                        lineHeight: 1.3,
                      }}
                    >
                      {card.title}
                    </Typography>

                    {/* Time display */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: card.isEmpty ? '#CCCCCC' : card.color,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {card.timeDisplay}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: card.isEmpty ? '#CCCCCC' : '#666666',
                        fontSize: '1rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {card.description}
                    </Typography>

                    {/* Action hint */}
                    {card.isEmpty && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#2196F3',
                          fontSize: '1rem',
                          fontWeight: 500,
                          mt: 2,
                        }}
                      >
                        Click to create reminder
                      </Typography>
                    )}
                  </Box>

                  {/* Right side - Icon and type */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 3 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        bgcolor: card.color,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 2,
                        boxShadow: `0 4px 12px ${card.color}40`,
                      }}
                    >
                      <Box sx={{ color: '#FFFFFF' }}>
                        {card.icon}
                      </Box>
                    </Box>
                    <Chip
                      label={card.type === 'medication' ? 'Medication' : card.type === 'general' ? 'General' : 'Empty'}
                      size="small"
                      sx={{
                        backgroundColor: card.type === 'medication' ? '#4CAF50' : card.type === 'general' ? '#FFC107' : '#E0E0E0',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

      {/* Quick Actions - Simplified version */}
      <Box mb={5} mt={8}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: '2rem',
            color: '#2C2C2C',
            mb: 1,
            letterSpacing: '-0.01em',
          }}
        >
          Quick Actions
        </Typography>
        <Box
          sx={{
            width: 60,
            height: 4,
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #8B6FAC 0%, #FF9671 100%)',
          }}
        />
      </Box>
      <Grid container spacing={4} mb={6}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                cursor: 'pointer',
                background: action.gradient,
                borderRadius: '32px',
                border: 'none',
                boxShadow: `0 6px 24px ${action.shadowColor}40`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 12px 40px ${action.shadowColor}50`,
                },
              }}
              onClick={action.action}
            >
              {/* Center large icon */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 4,
                  flex: '0 0 auto',
                }}
              >
                <Box
                  sx={{
                    color: '#FFFFFF',
                    width: 160,  // Increase background block
                    height: 160,
                    borderRadius: '32px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(5deg)',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '7rem',  // Extra large icon
                    }
                  }}
                >
                  {action.icon}
                </Box>
              </Box>

              {/* Title */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.8rem',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  flex: '0 0 auto',
                }}
              >
                {action.title}
              </Typography>

              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  flex: '1 1 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {action.description}
              </Typography>

              {/* Decorative elements - small plus sign */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                }}
              >
                +
              </Box>

              {/* Decorative small dots */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.4)',
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Error Display */}
      {error && (
        <Box mb={4}>
          <Alert severity="error" sx={{ fontSize: '1.1rem', borderRadius: 3 }}>
            Failed to load memory cards: {error}
          </Alert>
        </Box>
      )}

      {/* Recent Memory Cards - Simplified version */}
      {(memories && memories.length > 0) ? (
        <Box mt={8}>
          <Box mb={5}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: '2rem',
                color: '#2C2C2C',
                mb: 1,
                letterSpacing: '-0.01em',
              }}
            >
              Recent Memory Cards
            </Typography>
            <Box
              sx={{
                width: 60,
                height: 4,
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #8B6FAC 0%, #FFB84D 100%)',
              }}
            />
          </Box>
          <Grid container spacing={3}>
            {memories.slice(0, 3).map((memory, index) => (
              <Grid item xs={12} md={4} key={memory.id}>
                <MemoryCard
                  memory={memory}
                  index={index}
                  variant="default"
                  onDelete={handleDeleteClick}
                  onEdit={handleEditClick}
                  onView={handleViewClick}
                />
              </Grid>
            ))}
          </Grid>
          <Box mt={5} textAlign="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/memories')}
              sx={{
                background: 'linear-gradient(135deg, #8B6FAC 0%, #A98BBD 100%)',
                color: '#FFFFFF',
                fontSize: '1.3rem',
                fontWeight: 700,
                px: 8,
                py: 2.5,
                borderRadius: '20px',  // Larger rounded corners
                textTransform: 'none',
                boxShadow: '0 6px 24px rgba(139, 111, 172, 0.35)',
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7B5FA3 0%, #8B6FAC 100%)',
                  boxShadow: '0 8px 32px rgba(123, 95, 163, 0.45)',
                  transform: 'translateY(-3px) scale(1.02)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover::before': {
                  left: '100%',
                },
                transition: 'all 0.3s ease',
              }}
            >
            View All Memory Cards
            </Button>
          </Box>
        </Box>
      ) : (
        /* No Memory Cards State */
        <Box mt={8}>
          <Box mb={5}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: '2rem',
                color: '#2C2C2C',
                mb: 1,
                letterSpacing: '-0.01em',
              }}
            >
              Recent Memory Cards
            </Typography>
            <Box
              sx={{
                width: 60,
                height: 4,
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #8B6FAC 0%, #FFB84D 100%)',
              }}
            />
          </Box>
          
          {/* Empty State */}
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
              borderRadius: '24px',
              backgroundColor: '#F8F9FA',
              border: '2px dashed #E0E0E0',
            }}
          >
            <MemoryIcon sx={{ fontSize: 80, color: '#BDBDBD', mb: 3 }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#666666',
                mb: 2,
                fontSize: '1.5rem',
              }}
            >
              No memory cards yet
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#999999',
                mb: 4,
                fontSize: '1.1rem',
                maxWidth: '400px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Start creating your first memory card to preserve precious memories
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setCreateMemoryDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #8B6FAC 0%, #A98BBD 100%)',
                color: '#FFFFFF',
                fontSize: '1.3rem',
                fontWeight: 700,
                px: 6,
                py: 2,
                borderRadius: '20px',
                textTransform: 'none',
                boxShadow: '0 6px 24px rgba(139, 111, 172, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7B5FA3 0%, #8B6FAC 100%)',
                  boxShadow: '0 8px 32px rgba(123, 95, 163, 0.45)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Create Your First Memory Card
            </Button>
          </Box>
        </Box>
      )}

      {/* Quick Reminder Selection Dialog */}
      <QuickReminderSelectionDialog
        open={quickReminderSelectionDialogOpen}
        onClose={() => setQuickReminderSelectionDialogOpen(false)}
      />


      {/* Create Memory Card Dialog */}
      <CreateMemoryCardDialog
        open={createMemoryDialogOpen}
        onClose={() => setCreateMemoryDialogOpen(false)}
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
    </Box>
  )
}

export default Dashboard
