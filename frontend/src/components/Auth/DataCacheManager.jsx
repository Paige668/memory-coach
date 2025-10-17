import React, { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useMemory } from '../../context/MemoryContext'
import { useReminders } from '../../context/ReminderContext'

/**
 * Component that manages data cache clearing when user authentication changes
 * Triggers data refresh when user changes
 */
const DataCacheManager = () => {
  const { user, isAuthenticated } = useAuth()
  const { clearMemories, fetchMemories } = useMemory()
  const { clearReminders, fetchReminders } = useReminders()
  
  // Track previous user to detect changes
  const prevUserRef = useRef(null)

  useEffect(() => {
    const prevUser = prevUserRef.current
    
    console.log('🔍 DataCacheManager - User change detected:', {
      prevUser: prevUser?.id,
      newUser: user?.id,
      isAuthenticated
    })
    
    // When user changes (different user ID), refresh data
    if (user && prevUser && prevUser.id !== user.id) {
      console.log('🔄 User changed, refreshing data for new user:', user.id)
      
      // Clear old data and fetch new user's data
      clearMemories()
      clearReminders()
      
      // Fetch new user's data immediately
      fetchMemories()
      fetchReminders()
    }
    // When user logs in (no previous user but now has user)
    else if (user && !prevUser) {
      console.log('🔄 User logged in, fetching data for:', user.id)
      
      // Fetch user's data
      fetchMemories()
      fetchReminders()
    }
    
    // Update ref
    prevUserRef.current = user
  }, [user, clearMemories, clearReminders, fetchMemories, fetchReminders])

  // This component doesn't render anything
  return null
}

export default DataCacheManager
