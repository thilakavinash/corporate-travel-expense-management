# Corporate Travel & Expense Management Platform

A MERN stack application for managing corporate travel requests, expense tracking, and reimbursement processing.

## Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
corporate-travel-expense/
├── client/                          # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/             # Reusable components
│   │   ├── context/                # React Context providers
│   │   ├── pages/                  # Page components
│   │   ├── services/               # API calls
│   │   ├── utils/                  # Utility functions
│   │   ├── hooks/                  # Custom hooks
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                          # Express Backend
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   └── config.js               # Environment variables
│   ├── models/                     # Mongoose models
│   ├── controllers/                # Route controllers
│   ├── routes/                     # API routes
│   ├── middleware/                 # Custom middleware
│   ├── utils/                      # Utility functions
│   ├── uploads/                    # File storage (receipts)
│   ├── server.js                   # Entry point
│   └── package.json
├── docs/                           # Documentation
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas connection string)
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd corporate-travel-expense
```

### 2. Backend Setup

#### Navigate to the server directory:
```bash
cd server
```

#### Install dependencies:
```bash
npm install
```

#### Create environment file:
Copy `.env.example` to `.env` and configure your MongoDB connection:

```bash
copy .env.example .env
```

Update `.env` with your MongoDB URI:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/corporate-travel-expense
NODE_ENV=development
```

#### Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Navigate to the client directory:
```bash
cd ../client
```

#### Install dependencies:
```bash
npm install
```

#### Create environment file:
Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

The default configuration should work:
```
VITE_API_URL=http://localhost:5000
```

#### Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or the next available port)

### 4. Test the Setup

1. Open your browser and navigate to `http://localhost:5173`
2. Click the "Test Backend Connection" button
3. You should see a success message with the health check response

## Running the Application

### Backend Only
```bash
cd server
npm start
```

### Frontend Only
```bash
cd client
npm run dev
```

### Both (Run in separate terminals)
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

## Current Status

### Phase 1: Project Setup & Foundation ✅
- ✅ Project structure created
- ✅ Express server initialized
- ✅ MongoDB connection configured
- ✅ Environment variable setup
- ✅ Error handling middleware
- ✅ Health check endpoint
- ✅ React + Vite frontend initialized
- ✅ Axios configured for API communication
- ✅ Basic frontend application with connection test

## Next Phases

- **Phase 2**: Authentication System
- **Phase 3**: Travel Request Module
- **Phase 4**: Expense Management
- **Phase 5**: Reimbursement System
- **Phase 6**: Analytics Dashboard
- **Phase 7**: Admin Module
- **Phase 8**: Testing & Polish
- **Phase 9**: Documentation & Deployment

## Development Notes

- The backend is configured to continue running even if MongoDB is not available (for development)
- MongoDB connection error will be logged but won't crash the server
- Frontend uses environment variables for API URL configuration
- All sensitive data should be stored in environment variables

## Troubleshooting

### MongoDB Connection Issues
If you see "MongoDB Connection Error", ensure:
- MongoDB is running locally on port 27017
- Or update the `MONGODB_URI` in `server/.env` with your MongoDB Atlas connection string

### Port Already in Use
If port 5000 is already in use, change the `PORT` in `server/.env`
If port 5173 is already in use, Vite will automatically use the next available port

### Frontend Build Issues
If you encounter dependency issues, try:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

## License

ISC
