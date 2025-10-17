import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/authService'
import { memoryAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Get current user information to verify authentication and get user details
      const response = await authAPI.getCurrentUser()
      
      if (response.ok) {
        setIsAuthenticated(true)
        setUser(response.data) // Set actual user data
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.log('Auth check failed:', error)
      // If it's a 401 error, user is not authenticated
      if (error.response && error.response.status === 401) {
        setIsAuthenticated(false)
        setUser(null)
      } else {
        // For other errors, also treat as not authenticated
        setIsAuthenticated(false)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, pin, rememberMe = false) => {
    try {
      const response = await authAPI.verifyPin(email, pin, rememberMe)
      if (response.ok) {
        // Get full user information after successful login
        const userResponse = await authAPI.getCurrentUser()
        if (userResponse.ok) {
          setIsAuthenticated(true)
          setUser(userResponse.data)
          return { success: true }
        } else {
          throw new Error('Failed to get user information after login')
        }
      } else {
        throw new Error('Login verification failed')
      }
    } catch (error) {
      throw error
    }
  }

  const quickLogin = async (email, savedPin) => {
    try {
      const response = await authAPI.quickLogin(email, savedPin)
      if (response.ok) {
        // Get full user information after successful login
        const userResponse = await authAPI.getCurrentUser()
        if (userResponse.ok) {
          setIsAuthenticated(true)
          setUser(userResponse.data)
          return { success: true }
        } else {
          throw new Error('Failed to get user information after quick login')
        }
      } else {
        throw new Error('Quick login failed')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  const refreshAuthStatus = async () => {
    setLoading(true)
    await checkAuthStatus()
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    quickLogin,
    logout,
    checkAuthStatus,
    refreshAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
