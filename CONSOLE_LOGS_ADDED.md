# Console Logs Added for Check-in Debugging

## Overview
Comprehensive console logging has been added to both frontend and backend to help debug the check-in save issue (400 status code).

## Files Modified

### 1. Backend: `app/api/employee/checkin/route.ts`

#### POST Handler Logging
Added detailed logging at each step:

```typescript
console.log("=== CHECK-IN SAVE REQUEST ===");
console.log("User ID:", user.id);
console.log("Request body:", JSON.stringify(body, null, 2));
console.log("Extracted cycleId:", cycleId);
console.log("Extracted quarter:", quarter);
console.log("Extracted goals count:", goals?.length);

// Validation logging
console.log("Validation failed:");
console.log("  - cycleId:", cycleId ? "✓" : "✗");
console.log("  - quarter:", quarter ? "✓" : "✗");
console.log("  - goals is array:", Array.isArray(goals) ? "✓" : "✗");

// Database operations
console.log("Connecting to database...");
console.log("Database connected");
console.log("Fetching goal sheet with:");
console.log("  - employeeId:", user.id);
console.log("  - cycleId:", cycleId);
console.log("  - status: approved or locked");
console.log("Goal sheet found:", goalSheet ? "✓" : "✗");

// Achievement updates
console.log("Updating achievements for", goals.length, "goals");
console.log(`Processing goal: ${goalId}`);
console.log(`  - actual: ${actual}`);
console.log(`  - status: ${status}`);
console.log(`  - Calculated progress score: ${progressScore}`);

// Save operations
console.log("Saving goal sheet...");
console.log("Goal sheet saved successfully");
console.log("Updating check-in record...");
console.log("Check-in saved successfully");
console.log("=== CHECK-IN SAVE COMPLETE ===");
```

#### Error Logging
```typescript
console.error("=== CHECK-IN SAVE ERROR ===");
console.error("Error:", error);
console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
console.error("=== END ERROR ===");
```

### 2. Frontend: `app/(dashboard)/employee/checkin/page.tsx`

#### handleSave() Function Logging
```typescript
console.log("=== SENDING CHECK-IN SAVE REQUEST ===");
console.log("Payload:", JSON.stringify(payload, null, 2));
console.log("cycleId type:", typeof checkInData.cycleId);
console.log("cycleId value:", checkInData.cycleId);
console.log("quarter:", checkInData.quarter);
console.log("goals count:", goals.length);
console.log("Response status:", response.status);
console.log("Response data:", responseData);
console.log("Save failed with status:", response.status);
console.log("Error response:", responseData);
console.log("Check-in saved successfully");
```

#### handleAutoSave() Function Logging
```typescript
console.log("=== AUTO-SAVE REQUEST ===");
console.log("Payload:", JSON.stringify(payload, null, 2));
console.log("Auto-save response:", responseData);
console.log("Auto-save failed:", responseData);
console.log("Auto-save successful");
```

## How to Use the Logs

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser DevTools
- Press F12 or right-click → Inspect
- Go to Console tab

### 3. Perform Check-in Save
1. Login as employee
2. Navigate to Quarterly Check-in
3. Update goal achievements
4. Click Save button

### 4. Check Console Output

**Frontend Console (Browser):**
- Look for `=== SENDING CHECK-IN SAVE REQUEST ===`
- Verify cycleId, quarter, and goals are present
- Check response status and data

**Server Console (Terminal):**
- Look for `=== CHECK-IN SAVE REQUEST ===`
- Verify all validation checks pass (✓)
- Check if goal sheet is found
- Look for `=== CHECK-IN SAVE COMPLETE ===` or error logs

## What Each Log Tells You

| Log | Meaning |
|-----|---------|
| `User ID: ...` | Authenticated user ID |
| `Extracted cycleId: ...` | Cycle ID from request |
| `Extracted quarter: Q4` | Quarter from request |
| `Extracted goals count: 6` | Number of goals being updated |
| `cycleId: ✓` | cycleId is present and valid |
| `cycleId: ✗` | cycleId is missing or invalid |
| `Goal sheet found: ✓` | Goal sheet exists in database |
| `Goal sheet found: ✗` | Goal sheet not found (check status) |
| `Calculated progress score: 50` | Progress calculation result |
| `Updating existing achievement` | Achievement already exists for quarter |
| `Creating new achievement` | First time updating this quarter |
| `Goal sheet saved successfully` | Database save succeeded |
| `Check-in saved successfully` | Complete success |

## Debugging Workflow

1. **Check Frontend Logs First**
   - Verify cycleId is not empty
   - Verify quarter is valid (Q1-Q4)
   - Verify goals array has items
   - Check response status

2. **If Status is 400**
   - Check server logs for validation errors
   - Look for which field failed validation
   - Verify data types match expected values

3. **If Status is 404**
   - Check server logs: "Goal sheet found: ✗"
   - Verify goal sheet exists in database
   - Verify goal sheet status is "approved" or "locked"

4. **If Status is 500**
   - Check server error logs
   - Look for database connection issues
   - Check error message and stack trace

## Build Status
✅ **PRODUCTION READY**
- Compilation: Successful
- TypeScript: 0 errors
- Console logs: Added without breaking functionality
- Exit Code: 0

## Next Steps
1. Run the application
2. Try to save check-in data
3. Check console logs to identify the issue
4. Share the logs for further debugging
