# Seed Data Guide - AtomQuest Goals

This guide explains all the demo data that gets created when you run the seed script.

## Running the Seed Script

```bash
node scripts/seed-data.js
```

This will:
1. Clear all existing data from the database
2. Create demo users (admin, managers, employees)
3. Create an active goal cycle
4. Create goal sheets with sample goals
5. Create Q1 check-ins
6. Print login credentials

---

## Demo Users Created

### 1. Admin User
- **Email:** `admin@atomquest.com`
- **Password:** `Admin@123`
- **Role:** Admin
- **Department:** Management
- **Access:** Full system access, can manage users, cycles, and view all reports

### 2. Manager Users (2 total)

#### Manager One
- **Email:** `manager1@atomquest.com`
- **Password:** `Manager@123`
- **Role:** Manager
- **Department:** Engineering
- **Team:** Manages emp1, emp2, emp3
- **Access:** Can approve goals, review check-ins, view team reports

#### Manager Two
- **Email:** `manager2@atomquest.com`
- **Password:** `Manager@123`
- **Role:** Manager
- **Department:** Product
- **Team:** Manages emp4, emp5, emp6
- **Access:** Can approve goals, review check-ins, view team reports

### 3. Employee Users (6 total)

#### Engineering Team (Manager One)
- **emp1@atomquest.com** / `Employee@123` (EMP001)
- **emp2@atomquest.com** / `Employee@123` (EMP002)
- **emp3@atomquest.com** / `Employee@123` (EMP003)

#### Product Team (Manager Two)
- **emp4@atomquest.com** / `Employee@123` (EMP004)
- **emp5@atomquest.com** / `Employee@123` (EMP005)
- **emp6@atomquest.com** / `Employee@123` (EMP006)

---

## Demo Goal Cycle

**Name:** FY 2024-25 (or current year)
**Status:** Active
**Year:** 2024

### Check-in Windows
- **Q1:** March 1 - May 31
- **Q2:** June 1 - August 31
- **Q3:** September 1 - November 30
- **Q4:** December 1 - February 28

---

## Demo Goal Sheets

Each employee has a goal sheet with 4 sample goals:

### Goal 1: Improve API Performance
- **Thrust Area:** Product Excellence
- **Target:** 30% improvement
- **Weightage:** 25%
- **Q1 Achievement:** 15% (On Track)
- **Status:** On Track

### Goal 2: Mentor Junior Developers
- **Thrust Area:** Team Development
- **Target:** 2 developers
- **Weightage:** 20%
- **Q1 Achievement:** 1 developer (On Track)
- **Status:** On Track

### Goal 3: Complete Certification
- **Thrust Area:** Innovation
- **Target:** AWS Solutions Architect Certification
- **Weightage:** 15%
- **Q1 Achievement:** Not started
- **Status:** Not Started

### Goal 4: Customer Satisfaction
- **Thrust Area:** Customer Focus
- **Target:** 90% satisfaction score
- **Weightage:** 40%
- **Q1 Achievement:** 85% (On Track)
- **Status:** On Track

---

## Goal Sheet Statuses

The 6 employee goal sheets have different statuses to demonstrate the workflow:

| Employee | Status | Meaning |
|----------|--------|---------|
| emp1 | Draft | Not yet submitted to manager |
| emp2 | Submitted | Waiting for manager approval |
| emp3 | Approved | Manager approved the goals |
| emp4 | Returned | Manager returned for revision |
| emp5 | Draft | Not yet submitted |
| emp6 | Submitted | Waiting for approval |

---

## Q1 Check-ins

Three employees (emp1, emp2, emp3) have Q1 check-ins created:

**Check-in Comment:** "Good progress on API performance improvements. Keep up the momentum."

These demonstrate:
- How check-ins are linked to goal sheets
- Manager-employee relationship
- Quarter-specific progress tracking

---

## How to Test Different Workflows

### 1. Test Employee Workflow
**Login as:** emp1@atomquest.com / Employee@123

**What you can do:**
- View your dashboard
- See your goals (4 sample goals)
- View your goal sheet status (Draft)
- Create new goals
- Submit your goal sheet
- View check-ins

### 2. Test Manager Workflow
**Login as:** manager1@atomquest.com / Manager@123

**What you can do:**
- View team dashboard (3 employees)
- See pending approvals (emp2's submitted sheet)
- Approve/return goal sheets
- View team check-ins
- Review Q1 check-in for emp1

### 3. Test Admin Workflow
**Login as:** admin@atomquest.com / Admin@123

**What you can do:**
- View system dashboard
- Manage users
- Create/manage goal cycles
- View audit logs
- Generate reports
- View analytics

---

## Sample Data Breakdown

### Total Records Created
- **Users:** 9 (1 admin, 2 managers, 6 employees)
- **Goal Cycles:** 1 (Active)
- **Goal Sheets:** 6 (one per employee)
- **Goals:** 24 (4 per employee)
- **Check-ins:** 3 (Q1 for emp1, emp2, emp3)
- **Achievements:** 24 (4 per employee for Q1)

### Data Relationships
```
Admin User
├── Creates Goal Cycle (FY 2024-25)
│   ├── Manager One
│   │   ├── emp1 → Goal Sheet (Draft) → 4 Goals → Q1 Check-in
│   │   ├── emp2 → Goal Sheet (Submitted) → 4 Goals
│   │   └── emp3 → Goal Sheet (Approved) → 4 Goals → Q1 Check-in
│   └── Manager Two
│       ├── emp4 → Goal Sheet (Returned) → 4 Goals
│       ├── emp5 → Goal Sheet (Draft) → 4 Goals
│       └── emp6 → Goal Sheet (Submitted) → 4 Goals → Q1 Check-in
```

---

## Testing Scenarios

### Scenario 1: Complete Goal Approval Flow
1. Login as emp1 → Submit goal sheet
2. Login as manager1 → Approve emp1's goals
3. View updated status in emp1's dashboard

### Scenario 2: Goal Return & Revision
1. Login as emp4 → View returned goal sheet
2. Edit goals and resubmit
3. Login as manager2 → Approve revised goals

### Scenario 3: Check-in Progress Tracking
1. Login as emp1 → View Q1 check-in
2. Update progress on goals
3. Login as manager1 → Review check-in
4. Add manager comment

### Scenario 4: Analytics & Reporting
1. Login as admin
2. View analytics dashboard
3. Generate completion reports
4. View audit logs of all actions

---

## Resetting Demo Data

To clear all data and start fresh:

```bash
node scripts/seed-data.js
```

This will:
- Delete all users
- Delete all goal cycles
- Delete all goal sheets
- Delete all check-ins
- Recreate fresh demo data

---

## Notes

- All passwords are simple for demo purposes: `Admin@123`, `Manager@123`, `Employee@123`
- The goal cycle is set to the current fiscal year
- Q1 achievements are pre-populated to show progress tracking
- Check-ins are created for Q1 only
- All timestamps are set to recent dates for realistic demo data

---

## Next Steps

After seeding:

1. **Start the dev server:** `npm run dev`
2. **Login with different roles** to see different dashboards
3. **Test workflows** like goal submission and approval
4. **Create new goals** as an employee
5. **Approve/return goals** as a manager
6. **View reports** as an admin

Enjoy testing AtomQuest Goals! 🚀
