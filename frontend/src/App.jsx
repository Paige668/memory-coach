import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { MemoryProvider } from './context/MemoryContext'
import { AuthProvider } from './context/AuthContext'
import { ReminderProvider, useReminders } from './context/ReminderContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import MemoryManagement from './pages/MemoryManagement/MemoryManagement'
import RemindersManagement from './pages/RemindersManagement/RemindersManagement'
import MedicationReminderDisplay from './components/Reminder/MedicationReminderDisplay'
import QuizLanding from './pages/QuizManagement/QuizManagement';
import QuizRun from './pages/QuizManagement/QuizRun';
import WrongBook from './pages/QuizManagement/WrongBook';
import Login from './pages/Login/Login';
import Profile from './pages/Profile/Profile';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import DataCacheManager from './components/Auth/DataCacheManager';
import api from './services/api';
import '@fontsource/playfair-display/400-italic.css';

// Create theme optimized for elderly users
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#424242',
      light: '#6d6d6d',
      dark: '#212121',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1.1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      fontSize: '1.1rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '1.1rem',
          minHeight: 48,
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1.2rem',
          minHeight: 56,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '1.1rem',
          },
        },
      },
    },
  },
})

// Reminder system component that uses the global reminder context
const ReminderSystem = () => {
  const { reminders, getActiveReminders, acknowledgeReminder } = useReminders()
  const [firedIds, setFiredIds] = useState(() => new Set())
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [displayDialogOpen, setDisplayDialogOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState(null)
  const [acknowledgingIds, setAcknowledgingIds] = useState(() => new Set())

  // Helper functions
  const containsChinese = useCallback((text) => /[\u4e00-\u9fa5]/.test(text), [])
  const convertToEnglish = useCallback((text, type) => {
    if (!text || !containsChinese(text)) return text
    switch (type) {
      case 'drugName': return 'Medication'
      case 'quantity': return 'Dosage'
      default: return text
    }
  }, [containsChinese])
  const getTimingText = useCallback((timing) => {
    switch (timing) {
      case 'Before meals': return 'Before meals'
      case 'With meals': return 'With meals'
      case 'After meals': return 'After meals'
      case '饭前': return 'Before meals'
      case '饭中': return 'With meals'
      case '饭后': return 'After meals'
      default: return timing
    }
  }, [])


  // Immediate reminder check function
  const checkRemindersNow = (remindersToCheck = reminders) => {
    if (!Array.isArray(remindersToCheck) || remindersToCheck.length === 0) {
      console.log('No reminders to check immediately')
      return
    }

    const now = new Date()
    console.log('IMMEDIATE CHECK - Current time:', now.toLocaleTimeString())
    
    const getDate = (r) => new Date(r.next_run_at || r.scheduled_at)
    
      for (const r of remindersToCheck) {
        try {
          if (!r || r.is_active === false) continue
          if (!r.channels || !r.channels.includes('alarm')) continue
          // Skip reminders that have been acknowledged (have last_sent_at)
          if (r.last_sent_at) continue
          
          const when = getDate(r)
          if (!(when instanceof Date) || isNaN(when)) continue
          
          const diff = when.getTime() - now.getTime()
          console.log(`IMMEDIATE CHECK - Reminder ${r.rid}: scheduled at ${when.toLocaleTimeString()}, diff: ${Math.round(diff/1000)}s, fired: ${firedIds.has(r.rid)}`)
          
          // Trigger if time is reached (allow up to 1 hour late for overdue reminders)
          // Skip firedIds check for immediate check to catch missed reminders
          if (diff <= 0 && Math.abs(diff) <= 3600000) {
            console.log('IMMEDIATE TRIGGER:', r.rid)
            triggerReminder(r)
          }
        } catch (_e) {
          // ignore
        }
      }
  }

  // Extract reminder triggering logic into a separate function
  const triggerReminder = (r) => {
    console.log('🔥 TRIGGERING REMINDER:', r.rid, r.title, r.reminder_type)
    
    // Show browser notification if permission granted
    if (notificationPermission === 'granted') {
      try {
        const notification = new Notification('Medication Reminder', {
          body: r.reminder_type === 'medication' 
            ? (() => {
                try {
                  const info = JSON.parse(r.description || '{}')
                  const drugName = convertToEnglish(info.drugName || '', 'drugName')
                  const quantity = convertToEnglish(info.quantity || '', 'quantity')
                  const timing = getTimingText(info.timing || '')
                  return `${drugName} - ${quantity} (${timing})`
                } catch {
                  return 'Time to take your medication'
                }
              })()
            : r.title || 'Reminder',
          icon: '/favicon.ico',
          tag: `reminder-${r.rid}`,
          requireInteraction: true,
          silent: false
        })
        
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
        console.log('📱 Browser notification created')
      } catch (err) {
        console.warn('Failed to show notification:', err)
      }
    } else {
      console.log('⚠️ Notification permission not granted:', notificationPermission)
    }

    // Open display dialog for all reminder types
    console.log('🎯 Setting reminder and opening dialog...')
    setSelectedReminder(r)
    setDisplayDialogOpen(true)
    console.log('✅ Dialog should be open now')
    
    // mark as fired to avoid duplicate within this session
    setFiredIds(prev => new Set(prev).add(r.rid))
  }


  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      console.log('Initial notification permission:', Notification.permission)
      setNotificationPermission(Notification.permission)
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission granted:', permission)
          setNotificationPermission(permission)
        })
      }
    } else {
      console.log('Notifications not supported')
    }
    
    // Add global function for testing
    window.testReminder = () => {
      console.log('🧪 Testing reminder dialog...')
      const testReminder = {
        rid: 999,
        title: 'Test Reminder',
        reminder_type: 'medication',
        description: '{"drugName":"Test Medication","quantity":"1 tablet","timing":"After meals"}',
        scheduled_at: new Date().toISOString()
      }
      triggerReminder(testReminder)
    }
    
    // Add global function to check scheduler status
    window.checkScheduler = () => {
      console.log('📊 Scheduler Status:')
      console.log('- Reminders:', reminders.length)
      console.log('- FiredIds:', Array.from(firedIds))
      console.log('- AcknowledgingIds:', Array.from(acknowledgingIds))
      console.log('- DisplayDialogOpen:', displayDialogOpen)
      console.log('- SelectedReminder:', selectedReminder)
      console.log('- NotificationPermission:', notificationPermission)
    }
    
    // Add global function to force check overdue reminders
    window.forceCheckOverdue = () => {
      console.log('🔍 Force checking overdue reminders...')
      const now = new Date()
      reminders.forEach(r => {
        if (r && r.is_active && r.channels && r.channels.includes('alarm')) {
          const when = new Date(r.next_run_at || r.scheduled_at)
          const diff = when.getTime() - now.getTime()
          console.log(`Reminder ${r.rid}: scheduled at ${when.toLocaleTimeString()}, diff: ${Math.round(diff/1000)}s, fired: ${firedIds.has(r.rid)}`)
          
          // Trigger overdue reminders (more than 1 minute overdue)
          if (diff < -60000 && !firedIds.has(r.rid)) {
            console.log(`🚨 Triggering overdue reminder ${r.rid}`)
            triggerReminder(r)
          }
        }
      })
    }
    
    console.log('🛠️ Debug functions added:')
    console.log('- window.testReminder() - Test dialog manually')
    console.log('- window.checkScheduler() - Check scheduler status')
    console.log('- window.forceCheckOverdue() - Force check overdue reminders')
  }, [])

  // Component initialization
  useEffect(() => {
    console.log('APP MOUNTED - Starting reminder system...')
  }, [])

  // Global alarm scheduler
  useEffect(() => {
    console.log('SCHEDULER INITIALIZED - Starting alarm scheduler...')
    
    const timer = setInterval(() => {
      console.log('SCHEDULER TICK - Checking reminders...')
      
      const activeReminders = getActiveReminders()
      if (activeReminders.length === 0) {
        console.log('No active reminders to check')
        return
      }

      const now = new Date()
      console.log('Scheduler running at:', now.toLocaleTimeString(), 'Active reminders:', activeReminders.length, 'FiredIds:', Array.from(firedIds))
      
      // Reset firedIds for overdue reminders to allow retriggering
      const newFiredIds = new Set(firedIds)
      activeReminders.forEach(r => {
        const when = new Date(r.next_run_at || r.scheduled_at)
        const diff = when.getTime() - now.getTime()
        // If reminder is more than 1 hour overdue, remove from firedIds to allow retriggering
        if (diff < -3600000 && firedIds.has(r.rid)) {
          console.log(`Resetting fired status for overdue reminder ${r.rid}`)
          newFiredIds.delete(r.rid)
        }
      })
      if (newFiredIds.size !== firedIds.size) {
        setFiredIds(newFiredIds)
      }

      for (const r of activeReminders) {
        try {
          console.log(`Checking reminder ${r.rid} (${r.reminder_type}):`, {
            is_active: r.is_active,
            channels: r.channels,
            fired: newFiredIds.has(r.rid),
            next_run_at: r.next_run_at,
            scheduled_at: r.scheduled_at
          })
          
          if (newFiredIds.has(r.rid)) {
            console.log(`Skipping reminder ${r.rid}: already fired (firedIds: ${Array.from(newFiredIds)})`)
            continue
          }

          const when = new Date(r.next_run_at || r.scheduled_at)
          const diff = when.getTime() - now.getTime()
          console.log(`Reminder ${r.rid}: scheduled at ${when.toLocaleTimeString()}, diff: ${Math.round(diff/1000)}s`)
          
          // Trigger when time is reached (allow up to 1 hour late for overdue reminders)
          if (diff <= 0 && Math.abs(diff) <= 3600000) {
            console.log('TRIGGERING REMINDER:', r.rid)
            triggerReminder(r)
          }
        } catch (_e) {
          // ignore
        }
      }
    }, 5000) // Check every 5 seconds instead of 10

    return () => clearInterval(timer)
  }, [reminders, firedIds, notificationPermission, getActiveReminders])

  // Handle reminder acknowledgment
  const handleAcknowledgeReminder = async (reminderId) => {
    // Prevent duplicate calls
    if (acknowledgingIds.has(reminderId)) {
      console.log('⚠️ Already acknowledging reminder:', reminderId)
      return
    }
    
    try {
      setAcknowledgingIds(prev => new Set(prev).add(reminderId))
      console.log('🔄 Processing acknowledgment for reminder:', reminderId)
      
      const reminder = reminders.find(r => r.rid === reminderId)
      const body = { action: 'done' }

      if (reminder && reminder.repeat_rule && reminder.repeat_rule !== 'NONE') {
        const base = new Date(reminder.next_run_at || reminder.scheduled_at)
        if (!isNaN(base)) {
          const addDays = reminder.repeat_rule === 'WEEKLY' ? 7 : 1
          base.setDate(base.getDate() + addDays)
          const yyyy = base.getFullYear()
          const mm = String(base.getMonth() + 1).padStart(2, '0')
          const dd = String(base.getDate()).padStart(2, '0')
          const hh = String(base.getHours()).padStart(2, '0')
          const mi = String(base.getMinutes()).padStart(2, '0')
          const ss = '00'
          body.scheduled_at = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
        }
      }

      await acknowledgeReminder(reminderId)
      
      console.log('✅ Reminder acknowledged via global state')
      
      // IMPORTANT: Keep the reminder in firedIds to prevent retriggering
      // Don't delete from firedIds - this prevents the dialog from reopening
      console.log('✅ Reminder marked as processed, will not retrigger')
      
    } catch (err) {
      console.error('Error acknowledging reminder:', err)
    } finally {
      // Remove acknowledgment state
      setAcknowledgingIds(prev => {
        const next = new Set(prev)
        next.delete(reminderId)
        return next
      })
    }
  }

  return (
    <>
      {/* Global medication reminder display */}
      <MedicationReminderDisplay
        reminder={selectedReminder}
        open={displayDialogOpen}
        onClose={() => {
          setDisplayDialogOpen(false)
          setSelectedReminder(null)
        }}
        onAcknowledge={handleAcknowledgeReminder}
      />
    </>
  )
}

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MemoryProvider>
          <ReminderProvider>
            <DataCacheManager />
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/memories" element={<MemoryManagement />} />
                        <Route path="/reminders" element={<RemindersManagement />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/quiz" element={<QuizLanding />} />
                        <Route path="/quiz/run" element={<QuizRun />} />
                        <Route path="/quiz/wrong-book" element={<WrongBook />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
            
            {/* Global reminder system */}
            <ReminderSystem />
          </ReminderProvider>
        </MemoryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
