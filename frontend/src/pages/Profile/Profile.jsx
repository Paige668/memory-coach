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
  Avatar,
  Grid,
  Paper,
  Divider,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import api from '../../services/api'

const Profile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact: '',
    caregiver_email: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load user profile data
  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await api.get('/profile')
      setUser(response)
    } catch (error) {
      setError('Failed to load profile information')
      console.error('Profile load error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      const response = await api.put('/profile', user)
      
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Failed to save profile changes')
      console.error('Profile save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset to original data
    loadUserProfile()
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8D5F2 0%, #F0E6FF 50%, #E6F3FF 100%)',
        padding: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h3"
            sx={{
              color: '#2c3e50',
              fontWeight: 900,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
              mb: 2,
            }}
          >
            My Profile
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#7f8c8d',
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
              fontWeight: 600,
            }}
          >
            Manage your personal information and emergency contacts
          </Typography>
        </Box>

        {/* Profile Card */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
            {/* Success/Error Messages */}
            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                }}
              >
                {success}
              </Alert>
            )}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                }}
              >
                {error}
              </Alert>
            )}

            {/* Profile Header */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={4}
            >
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#7B5BA6',
                    fontSize: '2rem',
                    mr: 3,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#2c3e50',
                      fontWeight: 700,
                      fontSize: { xs: '1.8rem', sm: '2.2rem' },
                    }}
                  >
                    {user.name || 'Your Name'}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#7f8c8d',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      fontWeight: 400,
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant={isEditing ? "contained" : "outlined"}
                startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isLoading}
                sx={{
                  borderRadius: 3,
                  padding: '12px 24px',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  minHeight: '60px',
                  ...(isEditing ? {
                    background: 'linear-gradient(135deg, #7B5BA6 0%, #A98BBD 100%)',
                    color: '#FFFFFF',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6F4E98 0%, #9D7FB3 100%)',
                    },
                  } : {
                    borderColor: '#7B5BA6',
                    color: '#7B5BA6',
                    '&:hover': {
                      borderColor: '#6F4E98',
                      backgroundColor: 'rgba(123, 91, 166, 0.1)',
                    },
                  }),
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  isEditing ? 'Save Changes' : 'Edit Profile'
                )}
              </Button>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Profile Fields */}
            <Grid container spacing={4}>
              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    padding: 4,
                    borderRadius: 3,
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e9ecef',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#2c3e50',
                      fontWeight: 800,
                      fontSize: '2.2rem',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <PersonIcon sx={{ mr: 2, color: '#7B5BA6', fontSize: 36 }} />
                    Personal Information
                  </Typography>

                  <Box display="flex" flexDirection="column" gap={3}>
                    <TextField
                      label="Full Name"
                      value={user.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <PersonIcon sx={{ color: '#7B5BA6', fontSize: 32, mr: 2 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: '1.6rem',
                          fontWeight: 600,
                          minHeight: '80px',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.6rem',
                          fontWeight: 700,
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#7B5BA6',
                          },
                        },
                      }}
                    />

                    <TextField
                      label="Email Address"
                      value={user.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <EmailIcon sx={{ color: '#7B5BA6', fontSize: 32, mr: 2 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: '1.6rem',
                          fontWeight: 600,
                          minHeight: '80px',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.6rem',
                          fontWeight: 700,
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#7B5BA6',
                          },
                        },
                      }}
                    />

                    <TextField
                      label="Phone Number"
                      value={user.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <PhoneIcon sx={{ color: '#7B5BA6', fontSize: 32, mr: 2 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: '1.6rem',
                          fontWeight: 600,
                          minHeight: '80px',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.6rem',
                          fontWeight: 700,
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#7B5BA6',
                          },
                        },
                      }}
                    />

                    <TextField
                      label="Home Address"
                      value={user.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      multiline
                      rows={3}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <HomeIcon sx={{ color: '#7B5BA6', fontSize: 32, mr: 2, alignSelf: 'flex-start', mt: 1 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: '1.6rem',
                          fontWeight: 600,
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.6rem',
                          fontWeight: 700,
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#7B5BA6',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Emergency Contacts */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    padding: 4,
                    borderRadius: 3,
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e9ecef',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#2c3e50',
                      fontWeight: 800,
                      fontSize: '2.2rem',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <PhoneIcon sx={{ mr: 2, color: '#e74c3c', fontSize: 36 }} />
                    Emergency Contacts
                  </Typography>

                  <Box display="flex" flexDirection="column" gap={3}>
                    <TextField
                      label="Emergency Contact"
                      value={user.emergency_contact}
                      onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Name - Phone Number"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: '1.6rem',
                          fontWeight: 600,
                          minHeight: '80px',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.6rem',
                          fontWeight: 700,
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#7B5BA6',
                          },
                        },
                      }}
                    />

                    <TextField
                      label="Caregiver Email"
                      value={user.caregiver_email}
                      onChange={(e) => handleInputChange('caregiver_email', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <EmailIcon sx={{ color: '#7B5BA6', fontSize: 32, mr: 2 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: '1.6rem',
                          fontWeight: 600,
                          minHeight: '80px',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.6rem',
                          fontWeight: 700,
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#7B5BA6',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            {isEditing && (
              <Box
                display="flex"
                justifyContent="center"
                gap={3}
                mt={4}
              >
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 3,
                    padding: '12px 32px',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    minHeight: '60px',
                    borderColor: '#e74c3c',
                    color: '#e74c3c',
                    '&:hover': {
                      borderColor: '#c0392b',
                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default Profile
