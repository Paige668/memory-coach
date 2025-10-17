// Speech service - supports multiple speech-to-text solutions

class SpeechService {
  constructor() {
    this.recognition = null
    this.isSupported = false
    this.isListening = false
    this.onResult = null
    this.onError = null
    this.onEnd = null
    
    this.initSpeechRecognition()
  }

  // Initialize speech recognition
  initSpeechRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('Current browser does not support speech recognition')
      this.isSupported = false
      return
    }

    this.recognition = new SpeechRecognition()
    this.isSupported = true

    // Configure speech recognition parameters
    this.recognition.continuous = true // Enable continuous recognition
    this.recognition.interimResults = true // Show intermediate results
    this.recognition.lang = 'en-US' // Set language to English
    this.recognition.maxAlternatives = 1 // Maximum alternative results

    // Bind event handlers
    this.recognition.onstart = this.handleStart.bind(this)
    this.recognition.onresult = this.handleResult.bind(this)
    this.recognition.onerror = this.handleError.bind(this)
    this.recognition.onend = this.handleEnd.bind(this)
  }

  // Start speech recognition
  startListening(options = {}) {
    if (!this.isSupported) {
      const error = new Error('Current browser does not support speech recognition')
      this.onError && this.onError(error)
      return Promise.reject(error)
    }

    if (this.isListening) {
      this.stopListening()
    }

    return new Promise((resolve, reject) => {
      // Call callback function
      this.onResult = options.onResult || null
      this.onError = (error) => {
        options.onError && options.onError(error)
        reject(error)
      }
      this.onEnd = () => {
        options.onEnd && options.onEnd()
        resolve()
      }

      try {
        this.recognition.start()
      } catch (error) {
        reject(error)
      }
    })
  }

  // Stop speech recognition
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  // Handle recognition start
  handleStart() {
    this.isListening = true
    console.log('Speech recognition started')
  }

  // Handle recognition results
  handleResult(event) {
    let finalTranscript = ''
    let interimTranscript = ''

    // Process all recognition results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      
      if (event.results[i].isFinal) {
        // Add punctuation to final results
        const punctuatedTranscript = this.addPunctuation(transcript)
        finalTranscript += punctuatedTranscript
      } else {
        interimTranscript += transcript
      }
    }

    // Call callback function
    if (this.onResult) {
      this.onResult({
        finalTranscript,
        interimTranscript,
        isFinal: finalTranscript.length > 0,
      })
    }
  }

  // Add basic punctuation to transcript
  addPunctuation(text) {
    if (!text || text.trim().length === 0) return text
    
    // Remove existing punctuation at the end
    text = text.trim().replace(/[.!?]+$/, '')
    
    // Add period if the text doesn't end with punctuation
    if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
      // Check if it looks like a question
      const lowerText = text.toLowerCase()
      if (lowerText.includes('what') || lowerText.includes('how') || 
          lowerText.includes('when') || lowerText.includes('where') || 
          lowerText.includes('why') || lowerText.includes('who') ||
          lowerText.includes('?') || lowerText.includes('is') ||
          lowerText.includes('are') || lowerText.includes('do') ||
          lowerText.includes('does') || lowerText.includes('can') ||
          lowerText.includes('could') || lowerText.includes('would')) {
        text += '?'
      }
      // Check if it looks like an exclamation
      else if (lowerText.includes('wow') || lowerText.includes('amazing') ||
               lowerText.includes('great') || lowerText.includes('wonderful') ||
               lowerText.includes('fantastic') || lowerText.includes('!')) {
        text += '!'
      }
      // Default to period
      else {
        text += '.'
      }
    }
    
    // Add space after punctuation if not present
    return text + ' '
  }

  // Handle recognition errors
  handleError(event) {
    this.isListening = false
    let errorMessage = 'Speech recognition error occurred'

    switch (event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected, please try again'
        break
      case 'audio-capture':
        errorMessage = 'Cannot access microphone, please check permissions'
        break
      case 'not-allowed':
        errorMessage = 'Microphone permission denied, please allow access in browser settings'
        break
      case 'network':
        errorMessage = 'Network connection error, please check network settings'
        break
      case 'aborted':
        errorMessage = 'Speech recognition interrupted'
        break
      default:
        errorMessage = `Speech recognition error: ${event.error}`
    }

    const error = new Error(errorMessage)
    console.error('Speech recognition error:', error)
    
    if (this.onError) {
      this.onError(error)
    }
  }

  // Handle recognition end
  handleEnd() {
    this.isListening = false
    console.log('Speech recognition ended')
    
    if (this.onEnd) {
      this.onEnd()
    }
  }

  // Check browser support
  isBrowserSupported() {
    return this.isSupported
  }

  // Get current status
  getStatus() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
    }
  }

  // Set language
  setLanguage(lang = 'en-US') {
    if (this.recognition) {
      this.recognition.lang = lang
    }
  }

  // Set continuous recognition mode
  setContinuous(continuous = false) {
    if (this.recognition) {
      this.recognition.continuous = continuous
    }
  }
}

// Create singleton instance
const speechService = new SpeechService()

// Export service instance and utility functions
export default speechService

// Utility function: Check if browser supports speech recognition
export const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

// Utility function: Request microphone permission
export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop()) // Stop stream to release resources
    return true
  } catch (error) {
    console.error('Microphone permission request failed:', error)
    return false
  }
}

// Utility function: Get list of supported speech recognition languages
export const getSupportedLanguages = () => {
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
  ]
}
