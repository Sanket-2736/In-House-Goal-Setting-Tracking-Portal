# Quick Start Guide - AtomQuest Goals

## 1. Setup Database

Make sure MongoDB is running and `.env.local` has the correct `MONGODB_URI`.

## 2. Seed Demo Data

```bash
node scripts/seed-data.js
```

**Output:**
```
✓ Connected to MongoDB
✓ Cleared existing data
✓ Created 9 users (1 admin, 2 managers, 6 employees)
✓ Created active goal cycle
✓ Created 6 goal sheets with various statuses
✓ Created Q1 check-ins for 3 employees

LOGIN CREDENTIALS FOR TESTING
═══════════════════════════════════════════════════════════════
│ Role     │ Email                    │ Password      │
├──────────┼──────────────────────────┼───────────────┤
│ Admin    │ admin@atomquest.com      │ Admin@123     │
│ Manager  │ manager1@atomquest.com   │ Manager@123   │
│ Manager  │ manager2@atomquest.com   │ Manager@123   │
│ Employee │ emp1@atomquest.com       │ Employee@123  │
│ Employee │ emp2@atomquest.com       │ Employee@123  │
│ Employee │ emp3@atomquest.com       │ Employee@123  │
│ Employee │ emp4@atomquest.com       │ Employee@123  │
│ Employee │ emp5@atomquest.com       │ Employee@123  │
│ Employee │ emp6@atomquest.com       │ Employee@123  │
═══════════════════════════════════════════════════════════════
```

## 3. Start Dev Server

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

## 4. Login & Test

### As Employee (emp1@atomquest.com)
- View dashboard with 4 sample goals
- See goal sheet status (Draft)
- Submit goals to manager
- View Q1 check-in progress

### As Manager (manager1@atomquest.com)
- View team dashboard (3 employees)
- See pending approvals
- Approve/return goal sheets
- Review team check-ins

### As Admin (admin@atomquest.com)
- View system dashboard
- Manage users and cycles
- View audit logs
- Generate reports

---

## Demo Data Summary

| Item | Count | Details |
|------|-------|---------|
| Users | 9 | 1 admin, 2 managers, 6 employees |
| Goal Cycle | 1 | FY 2024-25 (Active) |
| Goal Sheets | 6 | Various statuses (draft, submitted, approved, returned) |
| Goals | 24 | 4 per employee |
| Check-ins | 3 | Q1 for emp1, emp2, emp3 |

---

## Sample Goals in Each Sheet

1. **Improve API Performance** (25% weightage)
   - Target: 30% improvement
   - Q1 Progress: 15% (On Track)

2. **Mentor Junior Developers** (20% weightage)
   - Target: 2 developers
   - Q1 Progress: 1 (On Track)

3. **Complete Certification** (15% weightage)
   - Target: AWS Solutions Architect
   - Q1 Progress: Not Started

4. **Customer Satisfaction** (40% weightage)
   - Target: 90% score
   - Q1 Progress: 85% (On Track)

---

## Key Features to Test

✅ **Employee Dashboard** - Real data from database
✅ **Goal Creation** - Create new goals with weightage
✅ **Goal Submission** - Submit to manager for approval
✅ **Manager Approvals** - Approve/return employee goals
✅ **Check-ins** - Track quarterly progress
✅ **Analytics** - View completion reports
✅ **Audit Logs** - Track all system actions
✅ **Role-based Access** - Different views for each role

---

## Troubleshooting

### "No active goal cycle found"
- Run seed script: `node scripts/seed-data.js`

### "Cannot connect to MongoDB"
- Check `MONGODB_URI` in `.env.local`
- Ensure MongoDB is running

### "Login fails"
- Use exact credentials from seed output
- Check `.env.local` has `NEXTAUTH_SECRET`

### "Goals not showing"
- Login as employee and check dashboard
- Seed data creates 4 goals per employee

---

## Next Steps

1. ✅ Seed database
2. ✅ Start dev server
3. ✅ Login with different roles
4. ✅ Test workflows
5. ✅ Create new goals
6. ✅ Submit for approval
7. ✅ View reports

Happy testing! 🚀
