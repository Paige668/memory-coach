import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AutoStories as LifeStoryIcon,
  Today as DailyRecordsIcon,
  People as PeopleIcon,
  Build as SkillsIcon,
  Psychology as FeelingsIcon,
  MoreHoriz as OthersIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'

const MemoryCard = ({ 
  memory, 
  onEdit, 
  onDelete, 
  onView,
  variant = 'default', // 'default', 'compact', 'detailed'
  index = 0 // Index for color assignment
}) => {
  const {
    id,
    title,
    content,
    created_at,
    updated_at,
    tags = [],
    voice_file_path,
  } = memory

  // Category configuration
  const categoryConfig = {
    life_story: {
      name: 'Life Story',
      icon: <LifeStoryIcon sx={{ fontSize: 16 }} />,
      color: '#E86A92',
      bgColor: 'rgba(232, 106, 146, 0.12)',
    },
    daily_records: {
      name: 'Daily Records',
      icon: <DailyRecordsIcon sx={{ fontSize: 16 }} />,
      color: '#FF7E6E',
      bgColor: 'rgba(255, 126, 110, 0.12)',
    },
    people_relationships: {
      name: 'People & Relationships',
      icon: <PeopleIcon sx={{ fontSize: 16 }} />,
      color: '#4ECDC4',
      bgColor: 'rgba(78, 205, 196, 0.1)',
    },
    skills_routines: {
      name: 'Skills & Routines',
      icon: <SkillsIcon sx={{ fontSize: 16 }} />,
      color: '#45B7D1',
      bgColor: 'rgba(69, 183, 209, 0.1)',
    },
    feelings_thoughts: {
      name: 'Feelings & Thoughts',
      icon: <FeelingsIcon sx={{ fontSize: 16 }} />,
      color: '#FFB84D',
      bgColor: 'rgba(255, 184, 77, 0.1)',
    },
    others: {
      name: 'Others',
      icon: <OthersIcon sx={{ fontSize: 16 }} />,
      color: '#95A5A6',
      bgColor: 'rgba(149, 165, 166, 0.1)',
    },
  }

  // Get category information
  const getCategoryInfo = () => {
    const categoryTag = tags.find(tag => tag.startsWith('category:'))
    if (categoryTag) {
      const categoryId = categoryTag.replace('category:', '')
      return categoryConfig[categoryId] || null
    }
    return null
  }

  const categoryInfo = getCategoryInfo()
  
  // Assign border color based on category or index
  const borderColors = ['#E86A92', '#FF7E6E', '#FFB84D']
  const borderColor = categoryInfo ? categoryInfo.color : borderColors[index % 3]

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, HH:mm')
    } catch (error) {
      return 'Date format error'
    }
  }

  const getCardStyle = () => {
    switch (variant) {
      case 'compact':
        return {
          maxHeight: 120,
          '& .MuiCardContent-root': {
            padding: '12px 16px',
            '&:last-child': {
              paddingBottom: '12px',
            },
          },
        }
      case 'detailed':
        return {
          minHeight: 200,
        }
      default:
        return {}
    }
  }

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onView) {
      e.preventDefault()
      onView(memory)
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',  // Pure white background
        borderRadius: '28px',
        border: 'none',
        borderRight: `10px solid ${borderColor}`,  // Right side colored border (thickened)
        boxShadow: '0 4px 16px rgba(139, 111, 172, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 8px 28px rgba(139, 111, 172, 0.18)',
          borderRight: `12px solid ${borderColor}`,  // Border widens on hover
        },
        ...getCardStyle(),
      }}
      tabIndex={0}
      onDoubleClick={() => onView && onView(memory)}
      onKeyDown={handleKeyDown}
    >
      <CardContent sx={{ flexGrow: 1, p: 3, pr: 3.5 }}>
        {/* Title bar */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography
            variant="h6"
            gutterBottom
            noWrap
            sx={{
              flexGrow: 1,
              mr: 1,
              fontWeight: 700,
              fontSize: '1.4rem',
              color: '#2C2C2C',
            }}
          >
            {title || 'No Title'}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            {/* Category tag */}
            {categoryInfo && (
              <Tooltip title={categoryInfo.name}>
                <Chip
                  icon={categoryInfo.icon}
                  label={categoryInfo.name}
                  size="small"
                  sx={{
                    backgroundColor: categoryInfo.bgColor,
                    color: categoryInfo.color,
                    border: `1px solid ${categoryInfo.color}`,
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: categoryInfo.color,
                    },
                  }}
                />
              </Tooltip>
            )}
            
            {/* Voice tag */}
            {voice_file_path && (
              <Tooltip title="Contains voice recording">
                <Chip
                  label="Voice"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Typography
          variant="body1"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: '#666666',
            fontSize: '1rem',
            lineHeight: 1.6,
            mb: 2
          }}
        >
          {content}
        </Typography>

        {/* Tags - Only show user-defined tags, not category tags */}
        {(() => {
          const userTags = tags.filter(tag => !tag.startsWith('category:'))
          return userTags.length > 0 && variant !== 'compact' && (
            <Box mb={2}>
              {userTags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
              {userTags.length > 3 && (
                <Chip
                  label={`+${userTags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
            </Box>
          )
        })()}
      </CardContent>

      {/* Bottom action bar: time info + buttons */}
      {variant !== 'compact' && (
        <CardActions sx={{ justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 2, pt: 0 }}>
          {/* Time information */}
          <Typography
            variant="caption"
            sx={{ 
              color: '#999999',
              fontSize: '0.85rem'
            }}
          >
            {formatDate(created_at)}
            {updated_at && updated_at !== created_at && (
              <span> • Edited</span>
            )}
          </Typography>
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* View button */}
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onView && onView(memory) }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(memory) }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(memory) }}
                onDoubleClick={(e) => e.stopPropagation()}
                sx={{
                  color: 'rgba(0, 0, 0, 0.4)',
                  '&:hover': {
                    color: 'rgba(0, 0, 0, 0.6)',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      )}
    </Card>
  )
}

export default MemoryCard
