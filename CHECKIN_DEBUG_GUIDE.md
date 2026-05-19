# Check-in Save Debug Guide

## Issue
POST requests to `/api/employee/checkin` are returning 400 status code, preventing check-in data from being saved.

## Console Logs Added

### Frontend Console Logs
**File**: `app/(dashboard)/employee/checkin/page.tsx`

#### In `handleSave()` function:
```
=== SENDING CHECK-IN SAVE REQUEST ===
Payload: {
  cycleId: "...",
  quarter: "Q4",
  goals: [...]
}
cycleId type: string
cycleId value: ...
quarter: Q4
goals count: 6
Response status: 400
Response data: { error: "..." }
```

#### In `handleAutoSave()` function:
```
=== AUTO-SAVE REQUEST ===
Payload: { cycleId, quarter, goals }
Auto-save response: { error: "..." }
```

### Backend Console Logs
**File**: `app/api/employee/checkin/route.ts`

#### In POST handler:
```
=== CHECK-IN SAVE REQUEST ===
User ID: ...
Request body: { cycleId, quarter, goals }
Extracted cycleId: ...
Extracted quarter: Q4
Extracted goals count: 6
Validation failed:
  - cycleId: ✓ or ✗
  - quarter: ✓ or ✗
  - goals is array: ✓ or ✗
Invalid cycleId format: ...
Connecting to database...
Database connected
Fetching goal sheet with:
  - employeeId: ...
  - cycleId: ...
  - status: approved or locked
Goal sheet found: ✓ or ✗
Goal sheet ID: ...
Total goals in sheet: 6
Updating achievements for 6 goals
Processing goal: ...
  - actual: 15
  - status: on_track
  - completionDate: ...
  - Goal found: Improve API Performance
  - Calculated progress score: 50
  - Updating existing achievement
Saving goal sheet...
Goal sheet saved successfully
Updating check-in record...
Creating new check-in record
Check-in saved successfully
=== CHECK-IN SAVE COMPLETE ===
```

#### Error logs:
```
=== CHECK-IN SAVE ERROR ===
Error: ...
Error message: ...
Error stack: ...
=== END ERROR ===
```

## How to Debug

### Step 1: Open Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `=== SENDING CHECK-IN SAVE REQUEST ===`

### Step 2: Check Frontend Logs
- Verify `cycleId` is present and not empty
- Verify `quarter` is one of: Q1, Q2, Q3, Q4
- Verify `goals` array has items
- Check `Response status` - should be 200 for success

### Step 3: Check Server Logs
1. Look at terminal where `npm run dev` is running
2. Find logs starting with `=== CHECK-IN SAVE REQUEST ===`
3. Check validation results:
   - All three fields should show ✓
   - cycleId should be valid MongoDB ObjectId format

### Step 4: Identify the Issue

**If validation fails:**
- Check which field is missing (cycleId, quarter, or goals)
- Verify data types match expected values

**If cycleId is invalid:**
- cycleId must be a valid MongoDB ObjectId (24 hex characters)
- Check if cycleId is being passed correctly from frontend

**If goal sheet not found:**
- Verify goal sheet exists in database
- Verify goal sheet status is "approved" or "locked"
- Check if employee ID matches

**If save fails:**
- Check error message in logs
- Look for database connection issues
- Verify goal data structure

## Common Issues and Solutions

### Issue: "cycleId, quarter, and goals array are required"
**Cause**: One of the required fields is missing or has wrong type
**Solution**: 
- Check frontend logs to see what's being sent
- Verify cycleId is not null/undefined
- Verify quarter is a string
- Verify goals is an array

### Issue: "Invalid cycleId format"
**Cause**: cycleId is not a valid MongoDB ObjectId
**Solution**:
- Ensure cycleId is a 24-character hex string
- Check if cycleId is being fetched correctly from API
- Verify active cycle endpoint returns valid ObjectId

### Issue: "No approved goal sheet found"
**Cause**: Goal sheet doesn't exist or has wrong status
**Solution**:
- Verify goal sheet was created and approved
- Check goal sheet status in database
- Ensure employee is logged in with correct account

### Issue: Database connection error
**Cause**: MongoDB connection failed
**Solution**:
- Check MONGODB_URI in .env.local
- Verify MongoDB is running
- Check network connectivity

## Testing Checklist

- [ ] Frontend logs show correct cycleId, quarter, goals
- [ ] Response status is 200 (not 400, 404, 500)
- [ ] Server logs show "Goal sheet found: ✓"
- [ ] Server logs show "Check-in saved successfully"
- [ ] No error logs in console
- [ ] Check-in data persists after page refresh

## Next Steps

1. Run `npm run dev`
2. Login as employee
3. Navigate to check-in page
4. Update a goal achievement
5. Click Save
6. Check both frontend and server console logs
7. Share the logs to identify the issue

## Files Modified
- `app/api/employee/checkin/route.ts` - Added comprehensive server-side logging
- `app/(dashboard)/employee/checkin/page.tsx` - Added frontend logging
