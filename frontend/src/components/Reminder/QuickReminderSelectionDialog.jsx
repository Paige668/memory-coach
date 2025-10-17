import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Medication as MedicationIcon,
  Alarm as AlarmIcon,
} from '@mui/icons-material'
import MedicationReminderDialog from './MedicationReminderDialog'
import QuickReminderDialog from './QuickReminderDialog'

const QuickReminderSelectionDialog = ({ open, onClose }) => {
  const [selectedType, setSelectedType] = useState(null)
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false)
  const [generalDialogOpen, setGeneralDialogOpen] = useState(false)

  // Handle reminder type selection
  const handleSelectReminderType = (type) => {
    if (type === 'medication') {
      setMedicationDialogOpen(true)
    } else if (type === 'general') {
      setGeneralDialogOpen(true)
    }
    setSelectedType(type)
  }

  // Handle dialog close
  const handleClose = () => {
    setSelectedType(null)
    onClose()
  }

  // Handle medication dialog close
  const handleMedicationDialogClose = () => {
    setMedicationDialogOpen(false)
    setSelectedType(null)
    onClose()
  }

  // Handle general dialog close
  const handleGeneralDialogClose = () => {
    setGeneralDialogOpen(false)
    setSelectedType(null)
    onClose()
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        {/* Header with orange background */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #FF9671 0%, #FFB598 100%)',
            color: 'white',
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box display="flex" alignItems="center">
            <AlarmIcon sx={{ mr: 1, fontSize: 24 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
              Quick Reminder
            </Typography>
          </Box>
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent>
          <Box sx={{ p: 3 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 4, 
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              What type of reminder would you like to create?
            </Typography>

            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                width: '100%'
              }}
            >
              {/* Medication Reminder Button */}
              <Box
                onClick={() => handleSelectReminderType('medication')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '2px solid #e0e0e0',
                  '&:hover': {
                    backgroundColor: '#E8F5E8',
                    borderColor: '#4CAF50',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                  }
                }}
              >
                <MedicationIcon sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    color: '#4CAF50'
                  }}
                >
                  Medication
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'text.secondary', 
                    mt: 1,
                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                    fontWeight: 500
                  }}
                >
                  Track your medications
                </Typography>
              </Box>

              {/* General Reminder Button */}
              <Box
                onClick={() => handleSelectReminderType('general')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '2px solid #e0e0e0',
                  '&:hover': {
                    backgroundColor: '#FFF8E1',
                    borderColor: '#FFC107',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                  }
                }}
              >
                <AlarmIcon sx={{ fontSize: 64, color: '#FFC107', mb: 2 }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    color: '#FFC107'
                  }}
                >
                  General
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'text.secondary', 
                    mt: 1,
                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                    fontWeight: 500
                  }}
                >
                  Set general reminders
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Medication Reminder Dialog */}
      <MedicationReminderDialog
        open={medicationDialogOpen}
        onClose={handleMedicationDialogClose}
      />

      {/* General Reminder Dialog */}
      <QuickReminderDialog
        open={generalDialogOpen}
        onClose={handleGeneralDialogClose}
      />
    </>
  )
}

export default QuickReminderSelectionDialog
