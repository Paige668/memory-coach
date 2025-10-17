import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  AutoStories as LifeStoryIcon,
  Today as DailyRecordsIcon,
  People as PeopleIcon,
  Build as SkillsIcon,
  Psychology as FeelingsIcon,
  MoreHoriz as OthersIcon,
} from '@mui/icons-material'

const CategorySelectionDialog = ({ open, onClose, onSelectCategory, onSkipCategory }) => {
  const categories = [
    {
      id: 'life_story',
      name: 'Life Story',
      description: 'Life stories and important experiences',
      icon: <LifeStoryIcon sx={{ fontSize: 36 }} />,
      color: '#E86A92',
      gradient: 'linear-gradient(135deg, #E86A92 0%, #F3A7C1 100%)',
    },
    {
      id: 'daily_records',
      name: 'Daily Records',
      description: 'Daily records and life snippets',
      icon: <DailyRecordsIcon sx={{ fontSize: 36 }} />,
      color: '#FF7E6E',
      gradient: 'linear-gradient(135deg, #FF7E6E 0%, #FFB09F 100%)',
    },
    {
      id: 'people_relationships',
      name: 'People & Relationships',
      description: 'Interpersonal relationships and social memories',
      icon: <PeopleIcon sx={{ fontSize: 36 }} />,
      color: '#4ECDC4',
      gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44B3B8 100%)',
    },
    {
      id: 'skills_routines',
      name: 'Skills & Routines',
      description: 'Skill learning and daily habits',
      icon: <SkillsIcon sx={{ fontSize: 36 }} />,
      color: '#45B7D1',
      gradient: 'linear-gradient(135deg, #45B7D1 0%, #96C7ED 100%)',
    },
    {
      id: 'feelings_thoughts',
      name: 'Feelings & Thoughts',
      description: 'Emotional expression and inner thoughts',
      icon: <FeelingsIcon sx={{ fontSize: 36 }} />,
      color: '#FFB84D',
      gradient: 'linear-gradient(135deg, #FFB84D 0%, #FFD93D 100%)',
    },
    {
      id: 'others',
      name: 'Others',
      description: 'Other types of memories',
      icon: <OthersIcon sx={{ fontSize: 36 }} />,
      color: '#95A5A6',
      gradient: 'linear-gradient(135deg, #95A5A6 0%, #BDC3C7 100%)',
    },
  ]

  const handleCategorySelect = (categoryId) => {
    onSelectCategory(categoryId)
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #F8F4FF 0%, #F0E8FF 100%)',
          maxHeight: '90vh',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1,
        pt: 3,
        position: 'relative'
      }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            color: '#7B5FA3',
            mb: 1,
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
          }}
        >
          Which category should this card belong to?
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#666666',
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
            fontWeight: 500
          }}
        >
          Choose the most suitable category to organize your memories
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: '#999999',
            '&:hover': {
              backgroundColor: 'rgba(139, 111, 172, 0.1)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1, flex: 1, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  borderRadius: '20px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    borderColor: category.color,
                    boxShadow: `0 12px 40px ${category.color}30`,
                  },
                }}
                onClick={() => handleCategorySelect(category.id)}
              >
                <CardContent sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Icon container */}
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '16px',
                      background: category.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      boxShadow: `0 4px 16px ${category.color}40`,
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                      }
                    }}
                  >
                    <Box sx={{ color: '#FFFFFF' }}>
                      {category.icon}
                    </Box>
                  </Box>

                  {/* Title */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#2C2C2C',
                      mb: 1,
                      fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' }
                    }}
                  >
                    {category.name}
                  </Typography>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666666',
                      lineHeight: 1.5,
                      fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                      fontWeight: 400
                    }}
                  >
                    {category.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onSkipCategory || onClose}
          sx={{
            color: '#999999',
            fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem' },
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: '12px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(153, 153, 153, 0.1)',
            }
          }}
        >
          Categorize Later
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CategorySelectionDialog
