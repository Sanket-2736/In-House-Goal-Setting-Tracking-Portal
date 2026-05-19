# Check-in API Error Fix

## Problem
When saving check-in data, the API was throwing a `BSONError: Argument passed in does not match the accepted types` error at line 132 of `app/api/employee/checkin/route.ts`.

```
Error saving check-in: BSONError: Argument passed in does not match the accepted types
at POST (app\api\employee\checkin\route.ts:132:16)
```

### Root Cause
The `cycleId` parameter being passed to the API was not a valid MongoDB ObjectId. The code was attempting to convert it directly to an ObjectId without validation:

```typescript
cycleId: new Types.ObjectId(cycleId)  // Fails if cycleId is invalid
```

## Solution

### 1. Added ObjectId Validation in API Route
**File**: `app/api/employee/checkin/route.ts`

Added validation in both GET and POST methods to check if the cycleId is a valid MongoDB ObjectId before attempting conversion:

```typescript
// Validate cycleId is a valid MongoDB ObjectId
if (!Types.ObjectId.isValid(cycleId)) {
  return NextResponse.json(
    { error: "Invalid cycleId format" },
    { status: 400 }
  );
}
```

This ensures that invalid cycleIds are rejected with a clear error message instead of causing a BSON error.

### 2. Improved Check-in Page to Fetch Active Cycle
**File**: `app/(dashboard)/employee/checkin/page.tsx`

Updated the `fetchCheckInData` function to automatically fetch the active cycle if no cycleId is provided in the URL:

```typescript
let activeCycleId = cycleId;

// If no cycleId provided, fetch the active cycle
if (!activeCycleId) {
  const cycleResponse = await fetch("/api/goals/cycles/active");
  if (!cycleResponse.ok) {
    throw new Error("Failed to fetch active cycle");
  }
  const cycleData = await cycleResponse.json();
  activeCycleId = cycleData.data._id;
}
```

This ensures that:
- If a valid cycleId is passed in the URL, it's used
- If no cycleId is provided, the active cycle is fetched automatically
- The cycleId is always valid before being sent to the API

## Files Modified
1. `app/api/employee/checkin/route.ts` - Added ObjectId validation
2. `app/(dashboard)/employee/checkin/page.tsx` - Added automatic active cycle fetching

## Testing

### Test 1: Check-in with Valid Cycle
1. Login as an employee
2. Navigate to Quarterly Check-in
3. Update goal achievements
4. Click Save
5. Should save successfully without BSON errors

### Test 2: Check-in Without Cycle ID
1. Navigate directly to `/employee/checkin` (without cycleId parameter)
2. Page should automatically fetch the active cycle
3. Should display goals and allow saving

### Test 3: Check-in with Invalid Cycle ID
1. Navigate to `/employee/checkin?cycleId=invalid`
2. Should show error: "Invalid cycleId format"

## Build Status
✅ **PRODUCTION READY**
- Compilation: Successful
- TypeScript: 0 errors
- Exit Code: 0

## Error Handling
The fix provides clear error messages:
- Invalid cycleId format: Returns 400 with "Invalid cycleId format"
- No approved goal sheet: Returns 404 with "No approved goal sheet found"
- Database errors: Handled by existing error handler

## Performance Impact
- Minimal: Only adds one validation check per request
- No additional database queries (validation is local)
- Reduces unnecessary database errors
