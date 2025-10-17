import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api', // Forward to backend through vite proxy
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Can add authentication token here
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Unified error handling
    if (error.response) {
      // Server returned error status code
      const message = error.response.data?.message || error.response.data?.error || 'Server error'
      throw new Error(message)
    } else if (error.request) {
      // Network error
      throw new Error('Network connection failed. Please check your internet connection.')
    } else {
      // Other errors
      throw new Error(error.message || 'Unknown error')
    }
  }
)

// Memory cards API
export const memoryAPI = {
  // Get all memory cards
  getAll: async () => {
    const response = await api.get('/get_memory')
    // Handle new response format: {ok: true, data: [...]}
    const data = response.ok ? response.data : response
    return Array.isArray(data) ? data : []
  },

  // Create memory card
  create: async (memoryData) => {
    const response = await api.post('/create_memory', memoryData)
    // Handle new response format: {ok: true, data: {...}}
    return response.ok ? response.data : response
  },

  // Update memory card
  update: async (id, memoryData) => {
    const response = await api.patch(`/update_memory/${id}`, memoryData)
    // Handle new response format: {ok: true, data: {...}}
    return response.ok ? response.data : response
  },

  // Delete memory card
  delete: async (id) => {
    const response = await api.delete(`/delete_memory/${id}`)
    return true
  },

  // Get single memory card
  getById: async (id) => {
    const response = await api.get(`/get_memory/${id}`)
    return response.memory
  },

  // Search memory cards
  search: async (query) => {
    const response = await api.get(`/search_memories?q=${encodeURIComponent(query)}`)
    return response.memories || []
  },
}

// Speech to text API (reserved interface)
export const speechAPI = {
  // Speech to text (Web Speech API version)
  speechToText: async (audioBlob) => {
    // Can integrate Web Speech API or OpenAI Whisper here in the future
    // Currently returns mock data
    throw new Error('Speech to text functionality not yet implemented')
  },

  // Upload audio file and convert to text (OpenAI Whisper version)
  transcribeAudio: async (audioFile) => {
    const formData = new FormData()
    formData.append('audio', audioFile)
    
    const response = await api.post('/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.transcription
  },
}

// Reminder API (reserved interface)
export const reminderAPI = {
  // Get all reminders
  getAll: async () => {
    const response = await api.get('/get_reminders')
    return response.reminders || []
  },

  // Create reminder
  create: async (reminderData) => {
    const response = await api.post('/create_reminder', reminderData)
    return response.reminder
  },

  // Update reminder
  update: async (id, reminderData) => {
    const response = await api.put(`/update_reminder/${id}`, reminderData)
    return response.reminder
  },

  // Delete reminder
  delete: async (id) => {
    await api.delete(`/delete_reminder/${id}`)
    return true
  },
}

// User settings API (reserved interface)
export const settingsAPI = {
  // Get user settings
  get: async () => {
    const response = await api.get('/settings')
    return response.settings
  },

  // Update user settings
  update: async (settings) => {
    const response = await api.put('/settings', settings)
    return response.settings
  },
}

export default api
