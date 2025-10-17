import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Close as CloseIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material'
import { useMemory } from '../../context/MemoryContext'
import speechService from '../../services/speechService'
import CategorySelectionDialog from './CategorySelectionDialog'

const CreateMemoryCardDialog = ({ open, onClose, initialCategoryKey = null, initialActiveTab = 0, skipInputMethod = false }) => {
  const { addMemory } = useMemory()
  const [step, setStep] = useState(1) // 1: select input method, 2: input content
  const [activeTab, setActiveTab] = useState(0) // 0: text, 1: voice
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceContent, setVoiceContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  
  // Determine color theme based on input method
  const isVoiceMode = activeTab === 1
  const primaryColor = isVoiceMode ? '#FF9671' : '#7E57C2'
  const secondaryColor = isVoiceMode ? '#FFB598' : '#9575CD'
  const lightColor = isVoiceMode ? '#FFF5EB' : '#F3E5F5'
  const borderColor = isVoiceMode ? '#FFB598' : '#9575CD'
  const hoverBorderColor = isVoiceMode ? '#FF9671' : '#7E57C2'
  
  // Category selection states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [pendingMemoryData, setPendingMemoryData] = useState(null)
  const [preselectedCategory, setPreselectedCategory] = useState(initialCategoryKey)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Handle input method selection
  const handleSelectInputMethod = (method) => {
    setActiveTab(method) // 0: text, 1: voice
    setStep(2) // Move to step 2
    setError(null)
  }

  // Handle back to step 1
  const handleBackToSelection = () => {
    if (isListening) {
      handleStopRecording()
    }
    // Only go back to step 1 if we're not skipping input method selection
    if (!skipInputMethod) {
      setStep(1)
    } else {
      // If we're skipping input method, close the dialog instead
      handleClose()
    }
    setError(null)
  }

  // Handle tab change (kept for backward compatibility, but not used in new flow)
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setError(null)
  }


  // Handle voice recording start
  const handleStartRecording = async () => {
    try {
      setError(null)
      setIsProcessing(true)
      
      // Check if browser supports speech recognition
      if (!speechService.isBrowserSupported()) {
        throw new Error('Your browser does not support speech recognition')
      }

      // Request microphone permission
      const hasPermission = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!hasPermission) {
        throw new Error('Microphone permission denied')
      }

      setIsListening(true)
      
      await speechService.startListening({
        onResult: (result) => {
          if (result.isFinal) {
            setVoiceContent(prev => prev + result.finalTranscript)
          } else {
            // Show interim results (optional)
            console.log('Interim:', result.interimTranscript)
          }
        },
        onError: (error) => {
          setError(error.message)
          setIsListening(false)
          setIsProcessing(false)
        },
        onEnd: () => {
          setIsListening(false)
          setIsProcessing(false)
        }
      })
    } catch (error) {
      setError(error.message)
      setIsProcessing(false)
    }
  }

  // Handle voice recording stop
  const handleStopRecording = () => {
    speechService.stopListening()
    setIsListening(false)
    setIsProcessing(false)
  }

  // Reflect prop changes to local preselected category
  React.useEffect(() => {
    setPreselectedCategory(initialCategoryKey)
  }, [initialCategoryKey])

  // When opened with skipInputMethod, jump directly to step 2 with given tab
  React.useEffect(() => {
    if (open) {
      if (skipInputMethod) {
        // Skip input method selection and go directly to step 2
        setStep(2)
        setActiveTab(initialActiveTab === 1 ? 1 : 0)
      } else {
        // Show input method selection
        setStep(1)
        setActiveTab(initialActiveTab === 1 ? 1 : 0)
      }
    }
  }, [open, initialActiveTab, skipInputMethod])

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const finalContent = activeTab === 0 ? content : voiceContent
      
      if (!finalContent.trim()) {
        setError('Please provide content')
        return
      }

      // Title is optional; if empty, generate from content (first 30 chars) or timestamp
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
      const effectiveTitle = title.trim() || generateAutoTitle(finalContent)

      // Build payload
      const memoryData = {
        title: effectiveTitle,
        content: finalContent.trim(),
        tags: [],
        voice_file_path: activeTab === 1 ? 'voice_recorded' : null,
      }

      // If category was preselected (from "Add to this category"), attach directly
      if (preselectedCategory) {
        const withCategory = { ...memoryData, tags: [`category:${preselectedCategory}`] }
        await addMemory(withCategory)
        handleClose()
        return
      }

      // Otherwise, store the memory data and show category selection dialog
      setPendingMemoryData(memoryData)
      setShowCategoryDialog(true)
      
    } catch (error) {
      console.error('Error preparing memory data:', error)
      setError(error.message || 'Failed to prepare memory card')
    }
  }

  // Handle category selection
  const handleCategorySelect = async (categoryId) => {
    try {
      if (!pendingMemoryData) {
        setError('No pending memory data found')
        return
      }

      // Add category tag to the memory data
      const memoryDataWithCategory = {
        ...pendingMemoryData,
        tags: [`category:${categoryId}`]
      }

      console.log('Submitting memory data with category:', memoryDataWithCategory)
      const created = await addMemory(memoryDataWithCategory)
      console.log('Memory created successfully:', created)

      // Reset form
      setTitle('')
      setContent('')
      setVoiceContent('')
      setActiveTab(0)
      setError(null)
      setPendingMemoryData(null)
      
      // Close all dialogs
      setShowCategoryDialog(false)
      onClose()
    } catch (error) {
      console.error('Error creating memory:', error)
      setError(error.message || 'Failed to create memory card')
      setShowCategoryDialog(false)
    }
  }

  // Handle skip category selection (create without category)
  const handleSkipCategory = async () => {
    try {
      if (!pendingMemoryData) {
        setError('No pending memory data found')
        return
      }

      console.log('Submitting memory data without category:', pendingMemoryData)
      const created = await addMemory(pendingMemoryData)
      console.log('Memory created successfully:', created)

      // Reset form
      setTitle('')
      setContent('')
      setVoiceContent('')
      setActiveTab(0)
      setError(null)
      setPendingMemoryData(null)
      
      // Close all dialogs
      setShowCategoryDialog(false)
      onClose()
    } catch (error) {
      console.error('Error creating memory:', error)
      setError(error.message || 'Failed to create memory card')
      setShowCategoryDialog(false)
    }
  }

  // Handle category dialog close without creating memory
  const handleCategoryDialogClose = () => {
    setShowCategoryDialog(false)
    setPendingMemoryData(null)
  }

  // Handle dialog close
  const handleClose = () => {
    // Stop recording if active
    if (isListening) {
      handleStopRecording()
    }
    
    // Reset form
    setStep(1)
    setTitle('')
    setContent('')
    setVoiceContent('')
    setActiveTab(0)
    setError(null)
    
    // Reset category selection states
    setShowCategoryDialog(false)
    setPendingMemoryData(null)
    
    onClose()
  }

  return (
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
      {/* Header with purple background */}
      <Box
        sx={{
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor} 88%, ${secondaryColor} 100%)`,
          color: 'white',
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box display="flex" alignItems="center">
          {step === 2 && (
            <IconButton 
              onClick={handleBackToSelection} 
              sx={{ 
                mr: 2, 
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box display="flex" alignItems="center">
            {activeTab === 1 ? (
              <MicIcon sx={{ mr: 1, fontSize: 24 }} />
            ) : (
              <EditIcon sx={{ mr: 1, fontSize: 24 }} />
            )}
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
              {step === 1 ? 'Create Memory Card' : 'Title & Content'}
            </Typography>
          </Box>
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Select Input Method */}
        {step === 1 && (
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
              How would you like to create your memory?
            </Typography>

            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                width: '100%'
              }}
            >
              {/* Text Input Button */}
              <Box
                onClick={() => handleSelectInputMethod(0)}
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
                    backgroundColor: '#F3E5F5',
                    borderColor: '#9575CD',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(126, 87, 194, 0.3)'
                  }
                }}
              >
                <EditIcon sx={{ fontSize: 64, color: '#7E57C2', mb: 2 }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    color: '#7E57C2'
                  }}
                >
                  Type
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
                  Write it down
                </Typography>
              </Box>

              {/* Voice Recording Button */}
              <Box
                onClick={() => handleSelectInputMethod(1)}
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
                    backgroundColor: '#FFF5EB',
                    borderColor: '#FFB598',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 150, 113, 0.3)'
                  }
                }}
              >
                <MicIcon sx={{ fontSize: 64, color: '#FF9671', mb: 2 }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    color: '#FF9671'
                  }}
                >
                  Speak
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
                  Say it aloud
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 2: Input Content (existing form) */}
        {step === 2 && (
          <Box sx={{ p: 3 }}>
            {/* Title Input */}
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              Title
            </Typography>
            <TextField
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (Optional) — e.g., Meeting notes, Daily reflection, Important event..."
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  '& fieldset': {
                    borderColor: borderColor,
                    borderWidth: 2
                  },
                  '&:hover fieldset': {
                    borderColor: hoverBorderColor
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: hoverBorderColor,
                    borderWidth: 2
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  padding: { xs: '16px 14px', sm: '18px 16px', md: '20px 18px' }
                }
              }}
            />

            {/* Content Input */}
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              Content
            </Typography>
            {activeTab === 0 ? (
              <TextField
                fullWidth
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                rows={8}
                placeholder="Write your memory details here..."
                sx={{
                  mb: 4,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                    '& fieldset': {
                      borderColor: borderColor,
                      borderWidth: 2
                    },
                    '&:hover fieldset': {
                      borderColor: hoverBorderColor
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: hoverBorderColor,
                      borderWidth: 2
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                    padding: { xs: '16px 14px', sm: '18px 16px', md: '20px 18px' }
                  }
                }}
              />
            ) : (
              <Box>
                {isListening ? (
                  <Box 
                    sx={{ 
                      border: `2px solid ${borderColor}`, 
                      borderRadius: 2, 
                      p: 3, 
                      minHeight: '120px',
                      backgroundColor: lightColor,
                      mb: 3
                    }}
                  >
                    <Typography color={primaryColor} fontStyle="italic" sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                      Listening... Speak now...
                    </Typography>
                  </Box>
                ) : voiceContent ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    value={voiceContent}
                    onChange={(e) => setVoiceContent(e.target.value)}
                    placeholder="Edit the transcribed text here..."
                    sx={{
                      mb: 4,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      backgroundColor: 'white',
                      fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                      '& fieldset': {
                        borderColor: borderColor,
                        borderWidth: 2
                      },
                      '&:hover fieldset': {
                        borderColor: hoverBorderColor
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: hoverBorderColor,
                        borderWidth: 2
                      }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                        padding: { xs: '16px 14px', sm: '18px 16px', md: '20px 18px' }
                      }
                    }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      border: `2px solid ${borderColor}`, 
                      borderRadius: 2, 
                      p: 3, 
                      minHeight: '120px',
                      backgroundColor: '#f8f9fa',
                      mb: 3
                    }}
                  >
                    <Typography color="text.secondary" fontStyle="italic">
                      Click the microphone button to start recording...
                    </Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="center" gap={2}>
                  {!isListening ? (
                    <Button
                      variant="contained"
                      startIcon={<MicIcon />}
                      onClick={handleStartRecording}
                      disabled={isProcessing}
                      sx={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                        borderRadius: 2,
                        px: 4,
                        py: 2,
                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                        fontWeight: 600,
                        color: '#FFFFFF',
                        boxShadow: isVoiceMode ? '0 6px 18px rgba(255, 150, 113, 0.3)' : '0 6px 18px rgba(126, 87, 194, 0.3)',
                        '&:hover': {
                          background: isVoiceMode ? 'linear-gradient(135deg, #E6855F 0%, #E69F7B 100%)' : 'linear-gradient(135deg, #6A3EB9 0%, #8C6CCF 100%)'
                        }
                      }}
                    >
                      {isProcessing ? 'Starting...' : 'Start Recording'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<StopIcon />}
                      onClick={handleStopRecording}
                      sx={{
                        backgroundColor: '#f44336',
                        borderRadius: 2,
                        px: 4,
                        py: 2,
                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: '#d32f2f'
                        }
                      }}
                    >
                      Stop Recording
                    </Button>
                  )}
                  
                  {isListening && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} sx={{ color: '#7E57C2' }} />
                      <Typography variant="h6" sx={{ color: '#7E57C2', fontWeight: 500, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                        Listening...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {step === 2 && (
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isListening || isProcessing}
            sx={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              borderRadius: 2,
              px: 5,
              py: 2,
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              color: '#FFFFFF',
              boxShadow: isVoiceMode ? '0 6px 18px rgba(255, 150, 113, 0.3)' : '0 6px 18px rgba(126, 87, 194, 0.3)',
              '&:hover': {
                background: isVoiceMode ? 'linear-gradient(135deg, #E6855F 0%, #E69F7B 100%)' : 'linear-gradient(135deg, #6A3EB9 0%, #8C6CCF 100%)'
              },
              '&:disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            Create Memory Card
          </Button>
        </DialogActions>
      )}

      {/* Category Selection Dialog */}
      <CategorySelectionDialog
        open={showCategoryDialog}
        onClose={handleCategoryDialogClose}
        onSelectCategory={handleCategorySelect}
        onSkipCategory={handleSkipCategory}
      />
    </Dialog>
  )
}

export default CreateMemoryCardDialog
