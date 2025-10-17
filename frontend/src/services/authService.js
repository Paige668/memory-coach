import api from './api'

// Authentication service for elderly-friendly login system
export const authAPI = {
  // Send verification PIN to email
  sendPin: async (email, caregiverEmail = null) => {
    try {
      const response = await api.post('/send_pin', {
        email: email.toLowerCase().trim(),
        caregiver_email: caregiverEmail
      })
      return response
    } catch (error) {
      // Transform error messages to be more user-friendly
      const friendlyMessages = {
        'email required': 'Please enter your email address',
        'send mail failed': 'Unable to send verification code. Please check your internet connection and try again.',
        'invalid email format': 'Please enter a valid email address'
      }
      
      const message = error.message || 'Failed to send verification code'
      const friendlyMessage = friendlyMessages[message] || message
      
      throw new Error(friendlyMessage)
    }
  },

  // Verify PIN and login
  verifyPin: async (email, pin, rememberMe = false) => {
    try {
      const response = await api.post('/verify_pin', {
        email: email.toLowerCase().trim(),
        pin: pin.toString(),
        remember_me: rememberMe
      })
      return response
    } catch (error) {
      // Transform error messages to be more user-friendly
      const friendlyMessages = {
        'email & pin required': 'Please enter both email and verification code',
        'invalid or expired pin': 'The verification code is incorrect or has expired. Please request a new code.',
        'email required': 'Please enter your email address',
        'pin required': 'Please enter the verification code'
      }
      
      const message = error.message || 'Login failed'
      const friendlyMessage = friendlyMessages[message] || message
      
      throw new Error(friendlyMessage)
    }
  },

  // Quick login with saved PIN
  quickLogin: async (email, savedPin) => {
    try {
      const response = await api.post('/quick_login', {
        email: email.toLowerCase().trim(),
        saved_pin: savedPin.toString()
      })
      return response
    } catch (error) {
      const friendlyMessages = {
        'email & saved_pin required': 'Please enter both email and PIN',
        'no saved pin available': 'No saved PIN found. Please use regular login.',
        'invalid saved pin': 'The PIN is incorrect. Please try again.',
        'email required': 'Please enter your email address'
      }
      
      const message = error.message || 'Quick login failed'
      const friendlyMessage = friendlyMessages[message] || message
      
      throw new Error(friendlyMessage)
    }
  },

  // Check if user has saved PIN
  checkSavedPin: async (email) => {
    try {
      const response = await api.post('/check_saved_pin', {
        email: email.toLowerCase().trim()
      })
      return response
    } catch (error) {
      throw new Error('Failed to check saved PIN')
    }
  },

  // Get current user information
  getCurrentUser: async () => {
    try {
      const response = await api.get('/me')
      return response
    } catch (error) {
      throw error
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/logout')
      return response
    } catch (error) {
      throw new Error('Logout failed. Please try again.')
    }
  },

  // Set PIN (for first-time users)
  setPin: async (pin) => {
    try {
      if (!pin || pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
        throw new Error('PIN must be 4-8 digits')
      }
      
      const response = await api.post('/pin_set', { pin })
      return response
    } catch (error) {
      const friendlyMessages = {
        'PIN must be 4–8 digits': 'PIN must be 4-8 numbers only',
        'unauthorized': 'Please log in first'
      }
      
      const message = error.message || 'Failed to set PIN'
      const friendlyMessage = friendlyMessages[message] || message
      
      throw new Error(friendlyMessage)
    }
  },

  // Verify PIN (for sensitive operations)
  verifyUserPin: async (pin) => {
    try {
      const response = await api.post('/pin_verify', { pin })
      return response
    } catch (error) {
      const friendlyMessages = {
        'PIN required': 'Please enter your PIN',
        'unauthorized': 'Please log in first'
      }
      
      const message = error.message || 'PIN verification failed'
      const friendlyMessage = friendlyMessages[message] || message
      
      throw new Error(friendlyMessage)
    }
  },

  // Request PIN reset (send code to caregiver email)
  requestPinReset: async () => {
    try {
      const response = await api.post('/pin_reset_request')
      return response
    } catch (error) {
      const friendlyMessages = {
        'no caregiver email': 'No caregiver email is set up. Please contact support.',
        'send mail failed': 'Unable to send reset code. Please try again later.'
      }
      
      const message = error.message || 'Failed to request PIN reset'
      const friendlyMessage = friendlyMessages[message] || message
      
      throw new Error(friendlyMessage)
    }
  },

  // Confirm PIN reset with caregiver code
  confirmPinReset: async (code, newPin) => {
    try {
      if (!newPin || newPin.length < 4 || newPin.length > 8 || !/^\d+$/.test(newPin)) {
        throw new Error('PIN must be 4-8 digits')
      }
      
      const response = await api.post('/pin_reset_confirm', {
        code: code.toString(),
        new_pin: newPin.toString()
      })
      return response
    } catch (error) {
      const friendlyMessages = {
        'code expired': 'The reset code has expired. Please request a new one.',
        'invalid code': 'The reset code is incorrect. Please check and try again.',
        'PIN must be 4–8 digits': 'PIN must be 4-8 numbers only'
      }
      
      const message = error.message || 'Failed to reset PIN'
      const friendlyMessage = friendlyMessages[message] || message
      
      throw new Error(friendlyMessage)
    }
  }
}

export default authAPI
