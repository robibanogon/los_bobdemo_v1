# Server Startup Guide

## Prerequisites
Ensure Node.js and npm are installed and available in your PATH.

## Starting the Application

### Option 1: Using Terminal (Recommended)
Open two separate terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```
Backend will run on: http://localhost:5001

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:3000

### Option 2: Using VS Code Integrated Terminal
1. Open VS Code terminal (Ctrl+` or Cmd+`)
2. Split terminal (click split icon)
3. In first terminal: `cd backend && npm start`
4. In second terminal: `cd frontend && npm run dev`

## Testing Document Viewer Feature

Once both servers are running:

1. **Login:**
   - Navigate to http://localhost:3000
   - Login as RM user: `rm1` / `password123`

2. **Navigate to Documents:**
   - Click on any application from the dashboard
   - Click "Manage Documents" button

3. **Test View Button:**
   - Click the 👁️ View button next to any uploaded document
   - Document should open in a new browser tab
   - Verify authentication works (no 401 errors)

4. **Test Download Button:**
   - Click the ⬇️ Download button next to any document
   - File should download with original filename
   - Success toast notification should appear

5. **Test Error Handling:**
   - Try viewing/downloading with network disconnected
   - Should show user-friendly error message

## Troubleshooting

### Backend won't start:
- Check if port 5001 is already in use
- Verify .env file exists in backend directory
- Run `npm install` in backend directory

### Frontend won't start:
- Check if port 3000 is already in use
- Verify .env file exists in frontend directory
- Run `npm install` in frontend directory

### Documents won't view/download:
- Verify backend server is running
- Check browser console for errors
- Verify you're logged in (token in localStorage)
- Check backend/data/uploads directory has files

## Environment Variables

**Backend (.env):**
```
PORT=5001
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5001/api
```

## Feature Documentation
See `QA/DOCUMENT_VIEWER_FEATURE.md` for detailed implementation information.