import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { memoryAPI } from '../services/api'

// Initial state
const initialState = {
  memories: [],
  loading: false,
  error: null,
  currentMemory: null,
}

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_MEMORIES: 'SET_MEMORIES',
  ADD_MEMORY: 'ADD_MEMORY',
  UPDATE_MEMORY: 'UPDATE_MEMORY',
  DELETE_MEMORY: 'DELETE_MEMORY',
  SET_CURRENT_MEMORY: 'SET_CURRENT_MEMORY',
  CLEAR_MEMORIES: 'CLEAR_MEMORIES',
}

// Reducer
const memoryReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload, error: null }
    
    case ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.payload }
    
    case ACTIONS.SET_MEMORIES:
      return { ...state, loading: false, memories: action.payload }
    
    case ACTIONS.ADD_MEMORY:
      // Add new memory to the beginning of the array (newest first)
      return { 
        ...state, 
        memories: [action.payload, ...state.memories],
        loading: false 
      }
    
    case ACTIONS.UPDATE_MEMORY:
      return {
        ...state,
        loading: false,
        memories: state.memories.map(memory =>
          memory.id === action.payload.id ? action.payload : memory
        )
      }
    
    case ACTIONS.DELETE_MEMORY:
      return {
        ...state,
        loading: false,
        memories: state.memories.filter(memory => memory.id !== action.payload)
      }
    
    case ACTIONS.SET_CURRENT_MEMORY:
      return { ...state, currentMemory: action.payload }
    
    case ACTIONS.CLEAR_MEMORIES:
      return { ...state, memories: [], currentMemory: null, error: null }
    
    default:
      return state
  }
}

// Context
const MemoryContext = createContext()

// Provider component
export const MemoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(memoryReducer, initialState)

  // Fetch all memory cards
  const fetchMemories = async () => {
    try {
      console.log('🔄 Fetching memories from API...')
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const memories = await memoryAPI.getAll()
      console.log('📝 Received memories from API:', memories)
      const safe = Array.isArray(memories) ? memories.filter(Boolean) : []
      console.log('✅ Safe memories array:', safe)
      dispatch({ type: ACTIONS.SET_MEMORIES, payload: safe })
    } catch (error) {
      console.error('❌ Failed to fetch memories:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  // Add new memory card
  const addMemory = async (memoryData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const newMemory = await memoryAPI.create(memoryData)

      console.log('Created memory from API:', newMemory)

      // Check if we got a valid memory object with required fields
      if (newMemory && typeof newMemory === 'object' && newMemory.id) {
        // Optimistically add to the list (will appear at the top)
        dispatch({ type: ACTIONS.ADD_MEMORY, payload: newMemory })
        return newMemory
      } else {
        // Fallback: refresh the entire list from backend
        console.warn('Memory creation returned unexpected format, refreshing list')
        await fetchMemories()
        return null
      }

    } catch (error) {
      console.error('Failed to create memory:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      throw error
    }
  }

  // Update memory card
  const updateMemory = async (id, memoryData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const updatedMemory = await memoryAPI.update(id, memoryData)
      dispatch({ type: ACTIONS.UPDATE_MEMORY, payload: updatedMemory })
      return updatedMemory
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      throw error
    }
  }

  // Delete memory card
  const deleteMemory = async (id) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      await memoryAPI.delete(id)
      dispatch({ type: ACTIONS.DELETE_MEMORY, payload: id })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      throw error
    }
  }

  // Set current memory card
  const setCurrentMemory = (memory) => {
    dispatch({ type: ACTIONS.SET_CURRENT_MEMORY, payload: memory })
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null })
  }

  // Clear all memories (for user logout/switch)
  const clearMemories = () => {
    console.log('🧹 MemoryContext - Clearing all memories')
    dispatch({ type: ACTIONS.CLEAR_MEMORIES })
  }

  // Fetch memory cards when component mounts
  useEffect(() => {
    fetchMemories()
  }, [])

  const value = {
    ...state,
    fetchMemories,
    addMemory,
    updateMemory,
    deleteMemory,
    setCurrentMemory,
    clearError,
    clearMemories,
  }

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  )
}

// Hook to use the context
export const useMemory = () => {
  const context = useContext(MemoryContext)
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider')
  }
  return context
}
