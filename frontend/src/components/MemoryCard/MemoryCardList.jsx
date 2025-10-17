import React from 'react'
import { Grid, Box, Pagination, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import MemoryCard from './MemoryCard'
import EmptyState from '../common/EmptyState'
import LoadingSpinner from '../common/LoadingSpinner'
import { Memory as MemoryIcon } from '@mui/icons-material'

const MemoryCardList = ({
  memories = [],
  loading = false,
  onEdit,
  onDelete,
  onShare,
  onToggleFavorite,
  variant = 'default',
  itemsPerPage = 12,
  showPagination = true,
  showSorting = true,
  sortBy = 'created_at',
  sortOrder = 'desc',
  onSortChange,
  onPageChange,
  currentPage = 1,
}) => {
  // Sort options
  const sortOptions = [
    { value: 'created_at_desc', label: 'Newest First' },
    { value: 'created_at_asc', label: 'Oldest First' },
    { value: 'updated_at_desc', label: 'Recently Updated' },
    { value: 'title_asc', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
  ]

  // Pagination calculation
  const totalPages = Math.ceil(memories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMemories = memories.slice(startIndex, endIndex)

  // Handle sort change
  const handleSortChange = (event) => {
    const [field, order] = event.target.value.split('_')
    if (onSortChange) {
      onSortChange(field, order)
    }
  }

  // Handle page change
  const handlePageChange = (event, page) => {
    if (onPageChange) {
      onPageChange(page)
    }
  }

  // Handle empty state
  if (!loading && memories.length === 0) {
    return (
      <EmptyState
        icon={<MemoryIcon sx={{ fontSize: 64 }} />}
        title="No memory cards yet"
        description="Click the button in the bottom right to create your first memory card and record beautiful memories"
        actionText="Create Memory Card"
        onAction={() => {/* TODO: Open create dialog */}}
      />
    )
  }

  return (
    <Box>
      {/* Loading State */}
      {loading && (
        <LoadingSpinner 
          message="Loading memory cards..." 
          size={60}
        />
      )}

      {/* Sort and pagination controls */}
      {!loading && memories.length > 0 && (
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          {/* Sort selection */}
          {showSorting && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={`${sortBy}_${sortOrder}`}
                label="Sort by"
                onChange={handleSortChange}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Pagination info */}
          {showPagination && totalPages > 1 && (
            <Box display="flex" alignItems="center" gap={2}>
              <Box color="text.secondary">
                Total {memories.length} records
              </Box>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Box>
      )}

      {/* Memory cards grid */}
      {!loading && paginatedMemories.length > 0 && (
        <Grid container spacing={3}>
          {paginatedMemories.map((memory) => (
            <Grid 
              item 
              xs={12} 
              sm={variant === 'compact' ? 6 : 6} 
              lg={variant === 'compact' ? 4 : 4} 
              key={memory.id}
            >
              <MemoryCard
                memory={memory}
                variant={variant}
                onEdit={onEdit}
                onDelete={onDelete}
                onShare={onShare}
                onToggleFavorite={onToggleFavorite}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Bottom pagination */}
      {!loading && showPagination && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  )
}

export default MemoryCardList
