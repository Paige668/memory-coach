# Memory Coach Frontend - Alzheimer's Memory Assistant

This is a frontend application for an Alzheimer's memory assistant, designed to help users record life memories through voice and text.

## Tech Stack

- **React 18** - User interface framework
- **Material-UI (MUI)** - UI component library
- **React Router** - Route management
- **Axios** - HTTP client
- **Vite** - Build tool

## Features

### Implemented
- ✅ Responsive layout design
- ✅ Interface optimized for elderly users (large fonts, high contrast)
- ✅ Memory card management system
- ✅ Speech recognition service integration (Web Speech API)
- ✅ State management (React Context)
- ✅ API service layer

### To be implemented
- 🔄 Speech-to-text memory card creation
- 🔄 Memory card edit and delete functionality
- 🔄 Reminder system
- 🔄 User settings page

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout/         # Layout components
│   │   ├── MemoryCard/     # Memory card components
│   │   └── common/         # Common components
│   ├── pages/              # Page components
│   │   ├── Dashboard/      # Dashboard page
│   │   └── MemoryManagement/ # Memory management page
│   ├── context/            # React Context
│   ├── services/           # API services
│   ├── App.jsx            # Main app component
│   └── main.jsx           # App entry point
├── public/                 # Static assets
└── package.json           # Dependencies configuration
```

## Installation and Running

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Start development server
```bash
npm run dev
```

The app will start at `http://localhost:3000`

### 3. Build for production
```bash
npm run build
```

## Development Notes

### Backend API Integration
The frontend connects to backend API through Vite proxy configuration:
- Development environment: `/api/*` proxies to `http://localhost:5000`
- Ensure backend service is running on port 5000

### Speech Features
- Uses Web Speech API for speech recognition
- Supports Chinese speech recognition
- Requires user microphone permission

### Accessibility Design
- Large font and high contrast design
- Simplified operation flow
- Optimized for elderly users

## Next Steps

1. **Speech-to-text functionality**: Implement complete voice recording and conversion workflow
2. **Memory card CRUD**: Complete create, edit, delete functionality
3. **Search and filtering**: Add memory card search functionality
4. **Reminder system**: Integrate reminder functionality
5. **Data persistence**: Complete API integration with backend

## Notes

- Speech recognition requires HTTPS environment (production)
- Some browsers may not support Web Speech API
- Requires user microphone permission