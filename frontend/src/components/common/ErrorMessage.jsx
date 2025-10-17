import React from 'react'
import { Alert, AlertTitle, Button, Box } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'

const ErrorMessage = ({ 
  error, 
  title = 'Error Occurred', 
  onRetry = null,
  severity = 'error',
  fullWidth = true 
}) => {
  if (!error) return null

  return (
    <Alert 
      severity={severity} 
      fullWidth={fullWidth}
      sx={{ mb: 2 }}
      action={
        onRetry && (
          <Button
            color="inherit"
            size="small"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {typeof error === 'string' ? error : error.message || 'Unknown error'}
    </Alert>
  )
}

export default ErrorMessage
