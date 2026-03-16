# Leave Balance Setup & Troubleshooting Guide

## Problem Statement

When a user registered and attempted to apply for leave, they received the following error:

```
No leave balance allocated for this leave type in the current year
```

This prevented users from submitting leave requests even though they had valid leave types available in the system.

---

## Root Cause Analysis

### Why This Error Occurred

The system had **3 underlying issues**:

#### 1. **Missing Balance Records for New Users**
- When a user registered, the system **did not automatically create leave balance records**.
- Each user needs a `LeaveBalance` record for **every active leave type** and **every year** they can request leave.
- Without these records, the backend validation couldn't find a balance to check against.

#### 2. **Incorrect Year Validation**
- The leave apply endpoint checked balance against the **current system year** (`new Date().getFullYear()`).
- If a user tried to apply for leave in a different year than today, the query would fail.
- Example: User applies for 2027 leave in 2026 → backend looks for 2026 balance → not found.

#### 3. **No Frontend Guidance**
- The "Apply Leave" form allowed users to select **any leave type**, even those without allocated balance.
- Users would fill out the form completely, then hit "Submit" only to receive an error.
- This provided poor UX and wasted user time.

---

## Solution Implemented

### Backend Changes

#### File: `src/controller/user.controller.js`

**Change:** Auto-initialize leave balances on user registration.

When a new user registers, the system now:
1. Fetches all **active leave types** from the database.
2. Creates a `LeaveBalance` record for **each leave type** for the **current year**.
3. Sets `totalAllocated` from `LeaveType.maxDaysPerYear`.
4. Sets `used = 0` and `remaining = totalAllocated`.

**Benefit:** New users can immediately apply for leave without HR intervention (unless they need subsequent-year balances).

#### File: `src/controller/leaveRequest.controller.js`

**Changes:**
1. Balance year now resolves from `fromDate.getFullYear()` instead of hardcoded current year.
2. Added validation to reject leave requests spanning multiple calendar years.
3. Improved error message to show the expected year.

**Before:**
```javascript
const currentYear = new Date().getFullYear();
const balance = await LeaveBalance.findOne({
  user: req.user._id,
  leaveType,
  year: currentYear,  // ❌ Always current system year
});
```

**After:**
```javascript
const requestYear = from.getFullYear();  // ✅ Uses request date year
const balance = await LeaveBalance.findOne({
  user: req.user._id,
  leaveType,
  year: requestYear,  // ✅ Correct year
});
```

### Frontend Changes

#### File: `src/pages/MyLeaves.jsx`

**Changes:**
1. Fetches user's leave balances for the **selected year**.
2. Filters leave type dropdown to show only types with `remaining > 0`.
3. Disables form submission if no balance available.
4. Shows helpful inline message explaining the issue.

**User Experience Improvement:**
- Before: User sees all leave types, submits, gets error.
- After: User sees only available leave types. If none, form is disabled with a clear message.

---

## How to Allocate Leave Balance

Now that the system is fixed, here's how to allocate balances to users so they can apply for leave.

### For a Single User (Recommended)

#### Step 1: Navigate to Leave Balances Page
- Login as **Admin** or **HR** role.
- Go to **Leave Balances** page (left sidebar).

#### Step 2: Fill the Allocation Form
In the **Bulk Allocate Balance** panel on the right:

1. **Select Employee:** Choose the user from the dropdown.
2. **Select Year:** Choose the year (default: current year).
3. **Click "Run Allocation Batch"**.

#### Step 3: Verify Success
- You should see a success toast: **"Bulk allocation successful!"**
- The new records will appear in the balances table below.
- Each active leave type will be allocated with `maxDaysPerYear` for that user.

#### Example:
- Employee: Jaydeep Popat
- Year: 2026
- Result: 6 balance records created (one for each active leave type)
  - Casual Leave: 12 days
  - Sick Leave: 10 days
  - Earned Leave: 18 days
  - Maternity Leave: 90 days
  - Paternity Leave: 7 days
  - Compensatory Off: 10 days

---

### For Multiple Users (Manual Process)

Currently, you must allocate per-user. Repeat the above steps for each user:

1. Select Employee → (next user)
2. Select Year → 2026
3. Click "Run Allocation Batch"
4. Repeat for each user

**Estimated time:** ~30 seconds per user.

---

### API Alternative (For Developers/Scripts)

If you prefer direct API calls:

#### Allocate All Active Leave Types for One User
```bash
POST /api/leave-balances/bulk
Content-Type: application/json

{
  "user": "<userId>",
  "year": 2026
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allocated": 6,
    "skipped": 0
  },
  "message": "Bulk allocation complete..."
}
```

#### Allocate a Specific Leave Type (Manual)
```bash
POST /api/leave-balances
Content-Type: application/json

{
  "user": "<userId>",
  "leaveType": "<leaveTypeId>",
  "year": 2026,
  "totalAllocated": 12
}
```

---

## Verification Checklist

After allocating balance, verify the fix is working:

### ✅ Step 1: Check Balance Records Exist
1. Go to **Leave Balances** page.
2. Search for the allocated user in the table.
3. Confirm records exist for all leave types + year.

### ✅ Step 2: User Can View Balance
1. Login as the allocated user.
2. Go to **Dashboard**.
3. Verify "Leave Balance" cards show allocated days.

### ✅ Step 3: User Can Apply Leave
1. Still logged in as user.
2. Go to **My Leaves** → **Apply Leave**.
3. Select a date range in year 2026.
4. Leave type dropdown should populate with available types.
5. Click **Submit Request**.
6. Success toast should appear: **"Leave application submitted successfully"**.

### ✅ Step 4: Manager Can Approve
1. Login as a **Manager** or **HR**.
2. Go to **Team Leaves**.
3. Find the submitted request.
4. Click **Approve**.
5. Verify the balance updates (used increases, remaining decreases).

---

## Important Notes

### For Requests Spanning Years
If a user tries to apply for leave across year boundaries (e.g., Dec 31 → Jan 2), the system will reject it with:
```
Leave request cannot span multiple calendar years
```

This prevents ambiguous year-based balance deduction. Keep requests within a single calendar year.

### For Future Years
If you want users to apply for 2027 leave in 2026, you must allocate 2027 balances **before they apply**.
- Just use the same allocation form, select **Year: 2027**.

### New User Registration
New users registered after this fix are **automatically** allocated balances for the current year. They can apply leave immediately.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| User still sees "No balance allocated" | Verify balance record exists in Leave Balances table for that user + leave type + year. If not, run bulk allocation. |
| Leave type dropdown is empty | User has no remaining balance for selected year. Either allocate new balance or wait for next year. |
| "Leave request cannot span multiple years" | Keep from/to dates in the same calendar year. |
| Bulk allocation says "skipped" | Balance already exists for that user + year combo (idempotent, safe to run again). |

---

## Quick Reference: Year-Based Behavior

| Scenario | Year Checked | How to Fix |
|----------|--------------|-----------|
| User applies for 2026 leave in 2026 | Looks for 2026 balance | Allocate 2026 balance |
| User applies for 2027 leave in 2026 | Looks for 2027 balance | Allocate 2027 balance before they apply |
| User applies for 2025 leave in 2026 | Looks for 2025 balance | (Usually blocked by business logic or past dates) |

---

## Summary

**The Fix:** Users auto-get balances on registration; year check uses request year; frontend shows only available types.

**Current Workflow:**
1. Admin/HR allocates leave balance(s) for users → **Leave Balances page**.
2. Users see available leave types in **My Leaves → Apply Leave**.
3. Users apply → backend checks correct year's balance → approval/rejection based on remaining days.

**Result:** ✅ No more "balance not found" errors.

---

## Questions?

Refer to this guide when:
- A user reports they can't apply for leave.
- A manager wants to know how yearly allocations work.
- You need to bulk-allocate balances for a department.

For technical details, see the backend API documentation in `README.md`.
