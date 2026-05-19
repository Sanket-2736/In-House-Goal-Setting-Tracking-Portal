# Testing Goal Sheets - Quick Guide

## Setup
1. Ensure MongoDB is running and connected
2. Run the seed script to populate demo data:
   ```bash
   node scripts/seed-data.js
   ```

## Demo Credentials
Use any of these employee accounts to test goal sheets:

| Email | Password | Department |
|-------|----------|-----------|
| emp1@atomquest.com | Employee@123 | Engineering |
| emp2@atomquest.com | Employee@123 | Engineering |
| emp3@atomquest.com | Employee@123 | Engineering |
| emp4@atomquest.com | Employee@123 | Product |
| emp5@atomquest.com | Employee@123 | Product |
| emp6@atomquest.com | Employee@123 | Product |

## Testing Steps

### 1. View Goal Sheets List
1. Login with an employee account
2. Navigate to **Goals** in the sidebar
3. You should see a list of goal sheets with different statuses:
   - Draft (editable)
   - Submitted (awaiting approval)
   - Approved (locked)
   - Returned (needs revision)

### 2. View Goal Sheet Details
1. Click on any goal sheet in the list
2. The detail page should load and display:
   - **Status Card**: Shows current submission status with dates
   - **Goals List**: Shows all 6 goals with:
     - Goal title and description
     - Thrust area (category)
     - Weightage (importance %)
     - Target value
     - Actual achievement value
     - Progress score (%)
     - Status badge (On Track, At Risk, Not Started)

### 3. Goal Data Structure
Each goal sheet contains 6 sample goals:
1. **Improve API Performance** - Product Excellence (25% weight)
2. **Mentor Junior Developers** - Team Development (20% weight)
3. **Complete Certification** - Innovation (15% weight)
4. **Customer Satisfaction** - Customer Focus (40% weight)
5. **Reduce Bug Count** - Operational Excellence (20% weight)
6. **Conduct Technical Workshops** - Knowledge Sharing (15% weight)

### 4. Achievement Data
Each goal has Q1 achievement data showing:
- Actual value achieved
- Progress score (0-100%)
- Status (on_track, at_risk, not_started)

### 5. Actions Available
- **Back to Goals**: Return to the goals list
- **Edit**: Available only for draft goal sheets
- **Download PDF**: Download goal sheet as PDF (coming soon)

## API Endpoints

### Fetch Goal Sheet by ID
```
GET /api/goals/sheet/[id]
```
**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "approved",
    "cycleId": {
      "name": "FY 2026-2027",
      "year": 2026
    },
    "goals": [...],
    "submittedAt": "2026-05-12T...",
    "approvedAt": "2026-05-15T..."
  }
}
```

### Fetch Goal Sheet for Current Cycle
```
GET /api/goals/sheet?cycleId=[cycleId]
```

## Troubleshooting

### Goal Sheet Not Found
- Ensure you're logged in as an employee
- Check that seed data has been run
- Verify the goal sheet ID is correct

### No Goals Displayed
- Check browser console for errors
- Verify MongoDB connection
- Check that seed script completed successfully

### Authorization Error
- Ensure you're viewing your own goal sheets
- Managers and admins cannot view employee goal sheets directly
- Use manager approval interface to review employee goals

## Features Implemented
✅ Real-time data fetching from database
✅ Proper error handling and user feedback
✅ Loading states with skeleton loaders
✅ Authorization checks (users can only view their own sheets)
✅ Responsive design (mobile, tablet, desktop)
✅ Toast notifications for errors
✅ Comprehensive logging for debugging
✅ Achievement tracking with progress scores
