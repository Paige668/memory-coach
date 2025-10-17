# Memory Coach - Alzheimer's Memory Assistant

Memory Coach is a comprehensive wellness web application designed specifically for individuals with mild to moderate Alzheimer's disease and their caregivers. It helps users capture life memories through voice and text, manage gentle reminders for medications and daily activities, and engage in cognitive exercises through interactive quizzes.

## Features

### Core Functionality

- **Memory Cards Management**
  - Create memory cards with text and voice recordings
  - Organize memories with categories and tags
  - Search and filter memories
  - Mark favorite memories
  - Edit and delete existing memories

- **Smart Reminder System**
  - Medication reminders with timing specifications (before/after meals)
  - General event reminders
  - Recurring reminder support
  - Visual and audio notifications
  - Email notifications to caregivers

- **Interactive Quiz System**
  - Cognitive exercises with multiple-choice questions
  - Wrong answer tracking and review
  - Progress monitoring
  - Caregiver-focused questions about Alzheimer's care

- **User Profile Management**
  - Personal information storage
  - Emergency contact management
  - PIN-based authentication with "Remember Me" functionality
  - Caregiver email integration

### Design Features

- **Accessibility-First Design**
  - Large fonts and high contrast colors
  - Simplified user interface
  - Optimized for elderly users
  - Touch-friendly interactions

- **Responsive Layout**
  - Mobile-first design
  - Split-screen login interface
  - Adaptive navigation
  - Cross-device compatibility

## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Material-UI (MUI)** - Component library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client with credentials
- **Vite** - Build tool and dev server
- **Date-fns** - Date manipulation

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM and database management
- **Flask-Login** - User session management
- **Flask-Mail** - Email notifications
- **Flask-Migrate** - Database migrations
- **SQLite** - Database (development)

### Authentication
- **PIN-based Authentication** - Simple 6-digit codes
- **Session Management** - Secure user sessions
- **Remember Me** - Long-term login persistence
- **Caregiver Reset** - Email-based PIN recovery

## Project Structure

```
memory-coach/
├── backend/                    # Flask backend application
│   ├── app.py                 # Application entry point
│   ├── config.py              # Configuration and app factory
│   ├── models/                # Database models
│   │   ├── user_model.py      # User authentication model
│   │   ├── memory_model.py    # Memory cards model
│   │   ├── reminder_model.py  # Reminders model
│   │   └── quiz_model.py      # Quiz system models
│   ├── routes/                # API endpoints
│   │   ├── registration.py    # Auth endpoints
│   │   ├── memory.py          # Memory cards API
│   │   ├── reminder.py        # Reminders API
│   │   ├── quiz.py            # Quiz system API
│   │   ├── profile.py         # User profile API
│   │   └── home.py            # Dashboard data API
│   ├── scripts/               # Utility scripts
│   └── server_seed/           # Initial data
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Layout/        # Navigation and layout
│   │   │   ├── MemoryCard/    # Memory card components
│   │   │   ├── Reminder/      # Reminder components
│   │   │   ├── Auth/          # Authentication components
│   │   │   └── common/        # Shared components
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard/     # Main dashboard
│   │   │   ├── MemoryManagement/ # Memory cards management
│   │   │   ├── RemindersManagement/ # Reminders management
│   │   │   ├── Profile/       # User profile
│   │   │   ├── QuizManagement/ # Quiz system
│   │   │   └── Login/         # Authentication
│   │   ├── context/           # React Context providers
│   │   ├── services/          # API service layer
│   │   └── assets/            # Static assets
│   └── public/                # Public static files
├── migrations/                # Database migration files
└── instance/                  # Database and uploads (runtime)
```

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **pip** (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd memory-coach
   ```

2. **Backend Setup**
   ```bash
   # Install Python dependencies
   pip install flask flask-sqlalchemy flask-login flask-mail flask-migrate python-dotenv

   # Set up environment variables (create .env file)
   echo "FLASK_APP=backend.app" > .env
   echo "FLASK_ENV=development" >> .env
   echo "SENDER_EMAIL=your-email@gmail.com" >> .env
   echo "SENDER_APP_PASSWORD=your-app-password" >> .env

   # Initialize database
   flask --app backend.app db init
   flask --app backend.app db migrate -m "Initial migration"
   flask --app backend.app db upgrade
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   # From project root
   python -m backend.app
   ```
   Backend will run on `http://localhost:5001`

2. **Start the Frontend Development Server**
   ```bash
   # From frontend directory
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:3002`

3. **Access the Application**
   - Open `http://localhost:3002` in your browser
   - The frontend will automatically proxy API requests to the backend

## Usage Guide

### First Time Setup

1. **Create Account**: Enter your email address to receive a 6-digit PIN
2. **Set PIN**: Choose a memorable 6-digit PIN for future logins
3. **Profile Setup**: Add personal information and emergency contacts
4. **Enable Remember Me**: For easier future logins

### Memory Cards

1. **Create Memory Card**
   - Click "Create Memory Card" on dashboard
   - Enter title and content (text or voice)
   - Add tags and select category
   - Save to your memory collection

2. **Manage Memories**
   - View all memories in chronological order
   - Search by title or content
   - Edit or delete existing memories
   - Mark favorites for quick access

### Reminders

1. **Create Medication Reminder**
   - Specify drug name, quantity, and timing
   - Set scheduled time and date
   - Choose reminder channels (visual, audio, email)
   - Set up recurring reminders if needed

2. **Create General Reminder**
   - Add reminder title and description
   - Set date and time
   - Configure notification preferences

### Quiz System

1. **Take Quiz**
   - Access from dashboard "Caregiver Quiz"
   - Answer 5 multiple-choice questions
   - Review explanations for each answer
   - Track your progress over time

2. **Review Wrong Answers**
   - Access "Wrong Book" to review incorrect answers
   - Learn from mistakes with detailed explanations
   - Retake questions to improve understanding

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Flask Configuration
FLASK_APP=backend.app
FLASK_ENV=development

# Database
DATABASE_URL=sqlite:///instance/mydatabase.db

# Email Configuration (for PIN reset and notifications)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
SENDER_EMAIL=your-email@gmail.com
SENDER_APP_PASSWORD=your-app-password

# Security
SECRET_KEY=your-secret-key-here
```

### Development Features

- **Quick Login**: Available in development mode for testing
  - Access: `http://localhost:5001/dev/login_as/<user_id>`
  - Only enabled when `DEV_LOGIN_ENABLED=True`

## Database Schema

### Core Tables

- **users**: User accounts and authentication
- **memories**: Memory cards with content and metadata
- **reminders**: Scheduled reminders and notifications
- **quiz_attempts**: Quiz session tracking
- **quiz_questions**: Question bank for cognitive exercises
- **wrong_questions**: Incorrect answers for review

### Key Relationships

- Users have many memories, reminders, and quiz attempts
- Memories can have voice recordings and tags
- Reminders support multiple notification channels
- Quiz system tracks individual question performance

## API Endpoints

### Authentication
- `POST /api/send_pin` - Send PIN to email
- `POST /api/verify_pin` - Verify PIN and login
- `POST /api/quick_login` - Login with saved PIN
- `POST /api/check_saved_pin` - Check if user has saved PIN
- `POST /api/logout` - Logout user

### Memory Cards
- `GET /api/get_memory` - Get user's memory cards
- `POST /api/create_memory` - Create new memory card
- `PATCH /api/update_memory/<id>` - Update memory card
- `DELETE /api/delete_memory/<id>` - Delete memory card

### Reminders
- `GET /api/get_reminder` - Get user's reminders
- `POST /api/create_reminder` - Create new reminder
- `PATCH /api/update_reminder/<id>` - Update reminder
- `DELETE /api/delete_reminder/<id>` - Delete reminder

### Quiz System
- `GET /api/create_quiz` - Start new quiz session
- `POST /api/check_quiz` - Check individual answer
- `POST /api/submit_quiz` - Submit complete quiz
- `GET /api/wrong_quiz` - Get wrong answers for review

### Profile
- `GET /api/get_profile` - Get user profile
- `PATCH /api/update_profile` - Update user profile

## Deployment

### Production Build

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure Production Environment**
   - Set `FLASK_ENV=production`
   - Configure production database (PostgreSQL recommended)
   - Set up HTTPS certificates
   - Configure email service

3. **Database Migration**
   ```bash
   flask --app backend.app db upgrade
   ```

### Docker Deployment (Optional)

```dockerfile
# Example Dockerfile for backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "-m", "backend.app"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Designed for Alzheimer's patients and caregivers
- Built with accessibility and usability in mind
- Inspired by the need for memory assistance tools
- Community-driven development approach

**Memory Coach** - We are your memory companion.