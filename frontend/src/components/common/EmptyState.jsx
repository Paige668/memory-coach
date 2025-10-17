import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

const EmptyState = ({ 
  icon,
  title = 'No Data',
  description = 'No content available',
  actionText = 'Add',
  onAction = null,
  actionIcon = <AddIcon />,
  fullHeight = false 
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      py={8}
      px={4}
      sx={{
        ...(fullHeight && {
          minHeight: '400px',
        }),
      }}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            color: 'text.secondary',
            mb: 3,
            opacity: 0.6,
          }}
        >
          {icon}
        </Box>
      )}
      
      <Typography 
        variant="h6" 
        color="text.secondary" 
        gutterBottom
        sx={{ mb: 2 }}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 400 }}
      >
        {description}
      </Typography>
      
      {onAction && (
        <Button
          variant="contained"
          size="large"
          startIcon={actionIcon}
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </Box>
  )
}

export default EmptyState
