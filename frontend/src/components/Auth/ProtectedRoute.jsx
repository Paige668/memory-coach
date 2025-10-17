import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Box, CircularProgress, Typography } from '@mui/material'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="#f8f9fa"
      >
        <CircularProgress size={60} sx={{ color: '#7B5BA6', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#666666' }}>
          Checking authentication...
        </Typography>
      </Box>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
