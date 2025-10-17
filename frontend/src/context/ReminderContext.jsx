import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'

// Create the context
const ReminderContext = createContext()

// Custom hook to use the reminder context
export const useReminders = () => {
  const context = useContext(ReminderContext)
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider')
  }
  return context
}

// Provider component
export const ReminderProvider = ({ children }) => {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch reminders from API
  const fetchReminders = useCallback(async () => {
    try {
      console.log('🔄 ReminderContext - Fetching reminders...')
      setLoading(true)
      setError(null)
      const response = await api.get('/get_reminder')
      console.log('✅ ReminderContext - Received reminders response:', response)
      // Extract data from new response format
      const data = response.ok ? response.data : response
      setReminders(data || [])
      console.log('📝 ReminderContext - Set reminders:', (data || []).length, 'items')
    } catch (err) {
      console.error('❌ ReminderContext - Failed to fetch reminders:', err)
      setError(err.message)
      setReminders([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new reminder
  const createReminder = useCallback(async (reminderData) => {
    try {
      console.log('➕ ReminderContext - Creating reminder:', reminderData)
      const response = await api.post('/create_reminder', reminderData)
      console.log('✅ ReminderContext - Created reminder response:', response)
      // Extract data from new response format
      const newReminder = response.ok ? response.data : response
      
      // Update local state immediately
      setReminders(prev => {
        const updated = [...prev, newReminder]
        console.log('📝 ReminderContext - Updated reminders list:', updated.length, 'items')
        return updated
      })
      
      return newReminder
    } catch (err) {
      console.error('❌ ReminderContext - Failed to create reminder:', err)
      throw err
    }
  }, [])

  // Update an existing reminder
  const updateReminder = useCallback(async (reminderId, updateData) => {
    try {
      console.log('✏️ ReminderContext - Updating reminder:', reminderId, updateData)
      const updatedReminder = await api.patch(`/update_reminder/${reminderId}`, updateData)
      console.log('✅ ReminderContext - Updated reminder:', updatedReminder)
      
      // Update local state immediately
      setReminders(prev => {
        const updated = prev.map(reminder => 
          reminder.rid === reminderId ? { ...reminder, ...updatedReminder } : reminder
        )
        console.log('📝 ReminderContext - Updated reminders list:', updated.length, 'items')
        return updated
      })
      
      return updatedReminder
    } catch (err) {
      console.error('❌ ReminderContext - Failed to update reminder:', err)
      throw err
    }
  }, [])

  // Delete a reminder
  const deleteReminder = useCallback(async (reminderId) => {
    try {
      console.log('🗑️ ReminderContext - Deleting reminder:', reminderId)
      await api.delete(`/delete_reminder/${reminderId}`)
      console.log('✅ ReminderContext - Deleted reminder:', reminderId)
      
      // Update local state immediately
      setReminders(prev => {
        const updated = prev.filter(reminder => reminder.rid !== reminderId)
        console.log('📝 ReminderContext - Updated reminders list:', updated.length, 'items')
        return updated
      })
    } catch (err) {
      console.error('❌ ReminderContext - Failed to delete reminder:', err)
      throw err
    }
  }, [])

  // Acknowledge a reminder (mark as completed)
  const acknowledgeReminder = useCallback(async (reminderId) => {
    try {
      console.log('✅ ReminderContext - Acknowledging reminder:', reminderId)
      
      // Prepare update data
      const now = new Date()
      const body = {
        last_sent_at: now.toISOString()
      }
      
      // Handle repeat reminders - calculate next run time
      const reminder = reminders.find(r => r.rid === reminderId)
      if (reminder && reminder.repeat_rule && reminder.repeat_rule !== 'none') {
        const scheduledAt = new Date(reminder.scheduled_at)
        const interval = reminder.repeat_interval || 1
        
        let nextRun = new Date(scheduledAt)
        
        switch (reminder.repeat_rule) {
          case 'daily':
            nextRun.setDate(nextRun.getDate() + interval)
            break
          case 'weekly':
            nextRun.setDate(nextRun.getDate() + (interval * 7))
            break
          case 'monthly':
            nextRun.setMonth(nextRun.getMonth() + interval)
            break
          case 'yearly':
            nextRun.setFullYear(nextRun.getFullYear() + interval)
            break
        }
        
        // Format the next run time
        const yyyy = nextRun.getFullYear()
        const mm = String(nextRun.getMonth() + 1).padStart(2, '0')
        const dd = String(nextRun.getDate()).padStart(2, '0')
        const hh = String(nextRun.getHours()).padStart(2, '0')
        const mi = String(nextRun.getMinutes()).padStart(2, '0')
        const ss = '00'
        body.next_run_at = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
      }
      
      await api.patch(`/update_reminder/${reminderId}`, body)
      console.log('✅ ReminderContext - Acknowledged reminder on server')
      
      // Update local state immediately
      setReminders(prev => {
        const updated = prev.map(reminder => 
          reminder.rid === reminderId 
            ? { ...reminder, last_sent_at: body.last_sent_at, ...(body.next_run_at && { next_run_at: body.next_run_at }) }
            : reminder
        )
        console.log('📝 ReminderContext - Updated reminders list after acknowledgment:', updated.length, 'items')
        return updated
      })
    } catch (err) {
      console.error('❌ ReminderContext - Failed to acknowledge reminder:', err)
      throw err
    }
  }, [reminders])

  // Get upcoming reminders (active, not completed, sorted by next_run_at)
  const getUpcomingReminders = useCallback(() => {
    const now = new Date()
    console.log('🕒 ReminderContext - Filtering upcoming reminders. Total reminders:', reminders.length)
    
    const filtered = reminders.filter(reminder => {
      // Must be active
      if (!reminder.is_active) {
        return false
      }
      
      // Must not be completed (no last_sent_at)
      if (reminder.last_sent_at) {
        return false
      }
      
      // Must have next_run_at or scheduled_at
      const runTime = reminder.next_run_at || reminder.scheduled_at
      if (!runTime) {
        return false
      }
      
      // Must be in the future
      const nextRunDate = new Date(runTime)
      if (nextRunDate <= now) {
        return false
      }
      
      return true
    })
    
    const sorted = filtered.sort((a, b) => {
      const timeA = new Date(a.next_run_at || a.scheduled_at)
      const timeB = new Date(b.next_run_at || b.scheduled_at)
      return timeA - timeB
    })
    
    console.log('📋 ReminderContext - Upcoming reminders:', sorted.length)
    return sorted
  }, [reminders])

  // Get active reminders for alarm system
  const getActiveReminders = useCallback(() => {
    const now = new Date()
    
    return reminders.filter(reminder => {
      if (!reminder || !reminder.is_active) {
        return false
      }
      
      if (!reminder.channels || !reminder.channels.includes('alarm')) {
        return false
      }
      
      // Skip reminders that have been acknowledged (have last_sent_at)
      if (reminder.last_sent_at) {
        return false
      }
      
      const when = new Date(reminder.next_run_at || reminder.scheduled_at)
      if (!(when instanceof Date) || isNaN(when)) {
        return false
      }
      
      const diff = when.getTime() - now.getTime()
      // Return reminders that should trigger (allow up to 1 hour late for overdue reminders)
      return diff <= 0 && Math.abs(diff) <= 3600000
    })
  }, [reminders])

  // Clear all reminders (for user logout/switch)
  const clearReminders = useCallback(() => {
    console.log('🧹 ReminderContext - Clearing all reminders')
    setReminders([])
    setError(null)
  }, [])

  // Initialize reminders on mount
  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  // Context value
  const value = {
    // State
    reminders,
    loading,
    error,
    
    // Actions
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    acknowledgeReminder,
    clearReminders,
    
    // Computed values
    getUpcomingReminders,
    getActiveReminders,
  }

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  )
}

export default ReminderContext
