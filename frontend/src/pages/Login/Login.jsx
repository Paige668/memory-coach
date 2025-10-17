import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  Email as EmailIcon,
  Security as SecurityIcon,
  Send as SendIcon,
  Login as LoginIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Home as HomeIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import careImage from '../../assets/care-image.jpg'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, quickLogin, refreshAuthStatus } = useAuth()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingPin, setIsSendingPin] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [rememberMe, setRememberMe] = useState(false)
  const [hasSavedPin, setHasSavedPin] = useState(false)

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Check if user has saved PIN when email changes
  useEffect(() => {
    const checkSavedPin = async () => {
      if (email && email.includes('@')) {
        try {
          const response = await authAPI.checkSavedPin(email)
          setHasSavedPin(response.has_saved_pin)
        } catch (error) {
          setHasSavedPin(false)
        }
      } else {
        setHasSavedPin(false)
      }
    }

    const debounceTimer = setTimeout(checkSavedPin, 500)
    return () => clearTimeout(debounceTimer)
  }, [email])

  // Handle email input with auto-formatting
  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase().trim()
    setEmail(value)
    setError('')
  }

  // Handle PIN input (only numbers)
  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 6) {
      setPin(value)
      setError('')
    }
  }

  // Send verification PIN
  const handleSendPin = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setIsSendingPin(true)
      setError('')
      setSuccess('')

      const response = await authAPI.sendPin(email)
      
      if (response.sent) {
        setSuccess('Verification code sent to your email! Please check your inbox.')
        setCountdown(60) // 60 seconds countdown
      }
    } catch (error) {
      setError(error.message || 'Failed to send verification code. Please try again.')
    } finally {
      setIsSendingPin(false)
    }
  }

  // Verify PIN and continue
  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!pin) {
      setError('Please enter the verification code')
      return
    }

    if (pin.length !== 6) {
      setError('Verification code must be 6 digits')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      let response
      let loginMethod = 'verification code'
      
      // First try quick login with saved PIN if user has one
      if (hasSavedPin) {
        try {
          response = await quickLogin(email, pin)
          loginMethod = 'saved PIN'
        } catch (quickLoginError) {
          // If quick login fails, try regular verification
          response = await login(email, pin, rememberMe)
          loginMethod = 'verification code'
        }
      } else {
        // Use regular PIN verification
        response = await login(email, pin, rememberMe)
      }
      
      if (response && (response.success || response.ok)) {
        setSuccess(`Welcome! Signed in with ${loginMethod}. Redirecting...`)
        
        // Refresh auth status to ensure it's properly set
        await refreshAuthStatus()
        
        // Redirect to the page they were trying to access, or home
        const from = location.state?.from?.pathname || '/dashboard'
        console.log('Login successful, redirecting to:', from)
        
        // Give some time for the success message to show
        setTimeout(() => {
          console.log('Navigating to:', from)
          navigate(from, { replace: true })
        }, 1500)
      } else {
        throw new Error('Login failed: Invalid response from server')
      }
    } catch (error) {
      setError(error.message || 'Invalid verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (pin) {
        handleSubmit()
      } else {
        handleSendPin()
      }
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
      }}
    >
      {/* Left Side - Image and Branding */}
      <Box
        sx={{
          flex: { xs: '0 0 40vh', lg: '0 0 50%' },
          position: 'relative',
          backgroundImage: `url(${careImage})`, // Care image
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: { xs: 4, lg: 6 },
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(106, 27, 154, 0.7) 0%, rgba(149, 117, 205, 0.6) 50%, rgba(179, 157, 219, 0.5) 100%)',
            zIndex: 1,
          }
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            background: `
              radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)
            `,
          }}
        />
        
        {/* Brand Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 3,
            textAlign: 'center',
            color: 'white',
            maxWidth: { xs: '100%', lg: '500px' },
            padding: { xs: '2rem 1rem', lg: '3rem 2rem' },
          }}
        >
          {/* App Icon */}
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <HomeIcon sx={{ fontSize: 50, color: 'white' }} />
          </Box>
          
          {/* App Title */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.5rem', lg: '3.5rem' },
              mb: '1.25rem',
              textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.7)',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            Memory Coach
          </Typography>
          
          
          {/* App Description */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '1.1rem', lg: '1.3rem' },
              mb: '20rem',
              textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)',
              color: '#FFFFFF',
              opacity: 0.95,
              maxWidth: { xs: '100%', lg: '450px' },
              textAlign: 'center',
              lineHeight: 1.5,
              margin: '0 auto',
            }}
          >
            Designed specifically for individuals with mild to moderate Alzheimer's and their caregivers
          </Typography>
          
          {/* Features */}
          <Box sx={{ mb: '1.5rem' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mb: '0.75rem',
              padding: '0.25rem 0'
            }}>
              <Typography sx={{ 
                fontSize: '1.4rem', 
                fontWeight: 600,
                textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)',
                color: '#FFFFFF'
              }}>
                📝 Memory Cards
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mb: '0.75rem',
              padding: '0.25rem 0'
            }}>
              <Typography sx={{ 
                fontSize: '1.4rem', 
                fontWeight: 600,
                textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)',
                color: '#FFFFFF'
              }}>
                🔔 Gentle Reminders
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mb: '0.75rem',
              padding: '0.25rem 0'
            }}>
              <Typography sx={{ 
                fontSize: '1.4rem', 
                fontWeight: 600,
                textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)',
                color: '#FFFFFF'
              }}>
                💝 Meaningful Connections
              </Typography>
            </Box>
          </Box>
          
          {/* Tagline */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.1rem', lg: '1.3rem' },
              fontStyle: 'italic',
              textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)',
              color: '#FFFFFF',
              opacity: 0.95,
              lineHeight: 1.4,
              padding: '0.5rem 0',
            }}
          >
            We are your memory companion
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: { xs: '1', lg: '0 0 50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 4, lg: 6 },
          background: 'linear-gradient(135deg, #F8F4FF 0%, #F3E8FF 50%, #FFFFFF 100%)',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h4"
              sx={{
                color: '#2C2C2C',
                fontWeight: 700,
                fontSize: { xs: '2.5rem', sm: '3rem' },
                mb: 1,
              }}
            >
              Welcome!
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#666666',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 400,
              }}
            >
              Sign in to your account
            </Typography>
          </Box>
          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, fontSize: '1.1rem' }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem' }}>
              {success}
            </Alert>
          )}

          {/* Email Input */}
          <Box mb={3}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: '#2C2C2C',
                fontSize: { xs: '1.5rem', sm: '1.7rem' },
              }}
            >
              📧 Email Address
            </Typography>
            <TextField
              fullWidth
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#7B5BA6' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  fontSize: '1.4rem',
                  '& fieldset': {
                    borderWidth: 2,
                    borderColor: '#E0E0E0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#7B5BA6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7B5BA6',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '16px 14px',
                  fontSize: '1.4rem',
                },
              }}
            />
          </Box>

          {/* Verification Code Input */}
          <Box mb={4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: '#2C2C2C',
                fontSize: { xs: '1.5rem', sm: '1.7rem' },
              }}
            >
              🔢 Verification Code
            </Typography>
            {hasSavedPin && (
              <Typography
                variant="body2"
                sx={{
                  color: '#7B5BA6',
                  fontSize: '1rem',
                  mb: 1,
                  fontStyle: 'italic',
                }}
              >
                💡 You can also use your saved PIN for quick access
              </Typography>
            )}
            <TextField
              fullWidth
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={handlePinChange}
              placeholder={hasSavedPin ? "Enter PIN or verification code" : "Enter 6-digit code"}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SecurityIcon sx={{ color: '#7B5BA6' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPin(!showPin)}
                      edge="end"
                      sx={{ color: '#7B5BA6' }}
                    >
                      {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  fontSize: '1.4rem',
                  '& fieldset': {
                    borderWidth: 2,
                    borderColor: '#E0E0E0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#7B5BA6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7B5BA6',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '16px 14px',
                  fontSize: '1.4rem',
                  textAlign: 'center',
                  letterSpacing: '0.2em',
                },
              }}
            />

            {/* Remember Me Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: '#7B5BA6',
                    '&.Mui-checked': {
                      color: '#7B5BA6',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 28,
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    color: '#666666',
                    fontWeight: 500,
                  }}
                >
                  Remember my PIN for quick access
                </Typography>
              }
              sx={{
                mt: 2,
                alignSelf: 'flex-start',
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Send Code Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSendPin}
              disabled={isSendingPin || countdown > 0 || !email}
              startIcon={isSendingPin ? <CircularProgress size={20} /> : <SendIcon />}
              sx={{
                borderRadius: 3,
                padding: '16px',
                fontSize: '1.4rem',
                fontWeight: 600,
                borderWidth: 2,
                borderColor: '#7B1FA2',
                color: '#7B1FA2',
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: '#7B1FA2',
                  color: 'white',
                },
                '&:disabled': {
                  borderColor: '#E0E0E0',
                  color: '#9E9E9E',
                },
              }}
            >
              {isSendingPin
                ? 'Sending...'
                : countdown > 0
                ? `Resend in ${countdown}s`
                : 'Send Verification Code'
              }
            </Button>

            {/* Login Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading || !email || !pin}
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <LoginIcon sx={{ fontSize: 28 }} />}
              sx={{
                borderRadius: 4,
                padding: '20px',
                fontSize: '1.4rem',
                fontWeight: 700,
                minHeight: '64px',
                color: '#FFFFFF !important',
                background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
                boxShadow: '0 12px 32px rgba(123, 31, 162, 0.3), 0 4px 16px rgba(123, 31, 162, 0.2)',
                transform: 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiButton-startIcon': {
                  color: '#FFFFFF !important',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%)',
                  boxShadow: '0 16px 40px rgba(123, 31, 162, 0.4), 0 6px 20px rgba(123, 31, 162, 0.3)',
                  transform: 'translateY(-2px)',
                  color: '#FFFFFF !important',
                },
                '&:hover .MuiButton-startIcon': {
                  color: '#FFFFFF !important',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 8px 24px rgba(123, 31, 162, 0.4)',
                  color: '#FFFFFF !important',
                },
                '&:active .MuiButton-startIcon': {
                  color: '#FFFFFF !important',
                },
                '&:disabled': {
                  backgroundColor: '#E0E0E0',
                  color: '#9E9E9E',
                  boxShadow: 'none',
                  transform: 'translateY(0)',
                },
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Help Text */}
          <Box textAlign="center">
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}
            >
              💡 <strong>Don't see the code?</strong> Check your spam folder or try resending.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                mt: 1,
              }}
            >
              🔒 <strong>Need help?</strong> Contact your caregiver for assistance.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Login
