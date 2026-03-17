# Document Buttons Verification Guide

## Issue Reported
User reported inconsistency: Some pages show View/Download/Delete buttons, while others only show Delete button.

## Current Implementation (Correct)

### DocumentUpload.jsx (lines 390-417)
The Actions column shows:
1. **👁️ View** - Always visible for all users and statuses
2. **⬇️ Download** - Always visible for all users and statuses
3. **🗑️ Delete** - Only visible when `canDelete` is true (RM role + Draft status)

### Code Logic
```javascript
const canDelete = application && application.status === 'Draft' && user?.role === 'RM';
```

## Expected Behavior

### For Draft Applications (RM User)
- ✅ View button (visible)
- ✅ Download button (visible)
- ✅ Delete button (visible)

### For Non-Draft Applications (Any User)
- ✅ View button (visible)
- ✅ Download button (visible)
- ❌ Delete button (hidden)

### For Draft Applications (Non-RM User)
- ✅ View button (visible)
- ✅ Download button (visible)
- ❌ Delete button (hidden)

## Troubleshooting Steps

### If You See Only Delete Button:

1. **Clear Browser Cache**
   - Chrome/Edge: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard Refresh**
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

3. **Verify Latest Code**
   ```bash
   cd frontend
   npm run build
   # Or restart dev server
   npm run dev
   ```

4. **Check Browser Console**
   - Open DevTools (F12)
   - Look for any JavaScript errors
   - Check if buttons are rendering

## Verification Test Cases

### Test 1: Draft Application as RM
1. Login as RM (rm1/password123)
2. Navigate to APP-2026-0001 (Draft status)
3. Click "Manage Documents"
4. Verify all 3 buttons visible: View, Download, Delete

### Test 2: In Review Application as Analyst
1. Login as Analyst (analyst1/password123)
2. Navigate to APP-2026-0006 (In Review status)
3. Click "Manage Documents"
4. Verify only 2 buttons visible: View, Download (no Delete)

### Test 3: Submitted Application as RM
1. Login as RM (rm1/password123)
2. Navigate to any Submitted application
3. Click "Manage Documents"
4. Verify only 2 buttons visible: View, Download (no Delete)

## Code Verification

### Current Code (Correct Implementation)
```jsx
<td style={{ padding: '12px', textAlign: 'center' }}>
  <button
    onClick={() => handleView(doc.id, doc.original_filename)}
    className="btn btn-primary btn-sm"
    style={{ padding: '4px 12px', fontSize: '14px', marginRight: '8px' }}
    title="View document in new tab"
  >
    👁️ View
  </button>
  <button
    onClick={() => handleDownload(doc.id, doc.original_filename)}
    className="btn btn-secondary btn-sm"
    style={{ padding: '4px 12px', fontSize: '14px', marginRight: '8px' }}
    title="Download document"
  >
    ⬇️ Download
  </button>
  {canDelete && (
    <button
      onClick={() => handleDelete(doc.id)}
      className="btn btn-danger btn-sm"
      style={{ padding: '4px 12px', fontSize: '14px' }}
      title="Delete document"
    >
      🗑️ Delete
    </button>
  )}
</td>
```

## Files to Check

1. **frontend/src/pages/DocumentUpload.jsx** - Main document management page
2. **frontend/src/services/api.js** - API endpoints for documents
3. **backend/src/routes/documents.js** - Backend document routes

## Notes

- This is the ONLY page that displays uploaded documents with action buttons
- AgentReview.jsx only shows missing documents (no action buttons)
- The implementation is correct and follows RBAC principles
- View and Download should ALWAYS be visible
- Delete should ONLY be visible for Draft applications by RM users

## Last Updated
March 17, 2026 - After completing TC177-TC180 testing