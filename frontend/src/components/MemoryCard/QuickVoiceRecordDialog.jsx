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
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material'
import {
  Close as CloseIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useMemory } from '../../context/MemoryContext'
import speechService from '../../services/speechService'
import CategorySelectionDialog from './CategorySelectionDialog'

const QuickVoiceRecordDialog = ({ open, onClose }) => {
  const { addMemory } = useMemory()
  const [isListening, setIsListening] = useState(false)
  const [voiceContent, setVoiceContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  
  // Category selection states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [pendingMemoryData, setPendingMemoryData] = useState(null)

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
      await navigator.mediaDevices.getUserMedia({ audio: true })

      setIsListening(true)
      
      await speechService.startListening({
        onResult: (result) => {
          if (result.isFinal) {
            setVoiceContent(prev => prev + result.finalTranscript)
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

  // Handle save as memory card
  const handleSaveAsMemoryCard = async () => {
    try {
      if (!voiceContent.trim()) {
        setError('Please record some content first')
        return
      }

      // Generate a simple title if not provided
      const finalTitle = title.trim() || `Voice Note ${new Date().toLocaleDateString()}`
      
      // Create memory card data
      const memoryData = {
        title: finalTitle,
        content: voiceContent.trim(),
        tags: [],
        voice_file_path: 'voice_recorded',
      }

      // Store the memory data and show category selection dialog
      setPendingMemoryData(memoryData)
      setShowCategoryDialog(true)
      
    } catch (error) {
      console.error('Error preparing voice note:', error)
      setError(error.message || 'Failed to prepare voice note')
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

      console.log('Saving voice note with category:', memoryDataWithCategory)
      await addMemory(memoryDataWithCategory)
      console.log('Voice note saved successfully')
      
      // Reset form
      setTitle('')
      setVoiceContent('')
      setError(null)
      setPendingMemoryData(null)
      
      // Close all dialogs
      setShowCategoryDialog(false)
      onClose()
    } catch (error) {
      console.error('Error saving voice note:', error)
      setError(error.message || 'Failed to save voice note')
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

      console.log('Saving voice note without category:', pendingMemoryData)
      await addMemory(pendingMemoryData)
      console.log('Voice note saved successfully')
      
      // Reset form
      setTitle('')
      setVoiceContent('')
      setError(null)
      setPendingMemoryData(null)
      
      // Close all dialogs
      setShowCategoryDialog(false)
      onClose()
    } catch (error) {
      console.error('Error saving voice note:', error)
      setError(error.message || 'Failed to save voice note')
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
    setTitle('')
    setVoiceContent('')
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
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Quick Voice Recording</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Record a quick voice note. You can save it as a memory card later.
        </Typography>

        {/* Title Input (Optional) */}
        <TextField
          fullWidth
          label="Title (Optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          placeholder="Give your voice note a title..."
        />

        {/* Voice Content Display */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Voice Content
          </Typography>
          
          {isListening ? (
            <Box 
              sx={{ 
                border: '1px solid #ccc', 
                borderRadius: 1, 
                p: 2, 
                minHeight: '120px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography color="primary" fontStyle="italic">
                Listening... Speak now...
              </Typography>
            </Box>
          ) : voiceContent ? (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={voiceContent}
              onChange={(e) => setVoiceContent(e.target.value)}
              placeholder="Edit the transcribed text here..."
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                },
              }}
            />
          ) : (
            <Box 
              sx={{ 
                border: '1px solid #ccc', 
                borderRadius: 1, 
                p: 2, 
                minHeight: '120px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography color="text.secondary" fontStyle="italic">
                Click the microphone button to start recording...
              </Typography>
            </Box>
          )}

          {/* Recording Controls */}
          <Box display="flex" justifyContent="center" mt={3} gap={2}>
            {!isListening ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<MicIcon />}
                onClick={handleStartRecording}
                disabled={isProcessing}
                color="primary"
                sx={{ minWidth: '160px' }}
              >
                {isProcessing ? 'Starting...' : 'Start Recording'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<StopIcon />}
                onClick={handleStopRecording}
                color="error"
                sx={{ minWidth: '160px' }}
              >
                Stop Recording
              </Button>
            )}
          </Box>

          {/* Recording Tips */}
          {isListening && (
            <Box mt={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                💡 Tip: You can pause between sentences. Recording will continue until you stop it.
              </Typography>
            </Box>
          )}

          {/* Recording Status */}
          {isListening && (
            <Box display="flex" justifyContent="center" alignItems="center" mt={2} gap={1}>
              <CircularProgress size={20} color="primary" />
              <Typography variant="body2" color="primary">
                Recording in progress... Speak clearly
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveAsMemoryCard} 
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={!voiceContent.trim() || isListening || isProcessing}
        >
          Save as Memory Card
        </Button>
      </DialogActions>

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

export default QuickVoiceRecordDialog
