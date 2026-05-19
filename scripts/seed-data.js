#!/usr/bin/env node

/**
 * Seed script for AtomQuest Goals
 * Run with: node scripts/seed-data.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://sanketbelekar29_db_user:tBG5hbT9NvgBxrH0@cluster0.zi3sfe9.mongodb.net/atomquest";

// Define schemas inline to avoid import issues
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "manager", "employee"] },
  department: String,
  employeeId: String,
  managerId: mongoose.Schema.Types.ObjectId,
  provider: String,
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const goalCycleSchema = new mongoose.Schema({
  name: String,
  year: Number,
  phase1Open: Date,
  q1Open: Date,
  q2Open: Date,
  q3Open: Date,
  q4Open: Date,
  isActive: Boolean,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

const goalSheetSchema = new mongoose.Schema({
  employeeId: mongoose.Schema.Types.ObjectId,
  cycleId: mongoose.Schema.Types.ObjectId,
  status: String,
  goals: Array,
  submittedAt: Date,
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const checkInSchema = new mongoose.Schema({
  goalSheetId: mongoose.Schema.Types.ObjectId,
  managerId: mongoose.Schema.Types.ObjectId,
  employeeId: mongoose.Schema.Types.ObjectId,
  quarter: String,
  comment: String,
  checkInDate: Date,
  cycleId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

// Get or create models
const User = mongoose.models.User || mongoose.model("User", userSchema);
const GoalCycle = mongoose.models.GoalCycle || mongoose.model("GoalCycle", goalCycleSchema);
const GoalSheet = mongoose.models.GoalSheet || mongoose.model("GoalSheet", goalSheetSchema);
const CheckIn = mongoose.models.CheckIn || mongoose.model("CheckIn", checkInSchema);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");
  } catch (error) {
    console.error("✗ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

async function clearDatabase() {
  try {
    await User.deleteMany({});
    await GoalCycle.deleteMany({});
    await GoalSheet.deleteMany({});
    await CheckIn.deleteMany({});
    console.log("✓ Cleared existing data");
  } catch (error) {
    console.error("✗ Failed to clear database:", error.message);
    throw error;
  }
}

async function seedUsers() {
  const users = [
    {
      name: "Admin User",
      email: "admin@atomquest.com",
      password: "Admin@123",
      role: "admin",
      department: "Management",
    },
    {
      name: "Manager One",
      email: "manager1@atomquest.com",
      password: "Manager@123",
      role: "manager",
      department: "Engineering",
    },
    {
      name: "Manager Two",
      email: "manager2@atomquest.com",
      password: "Manager@123",
      role: "manager",
      department: "Product",
    },
    {
      name: "Employee One",
      email: "emp1@atomquest.com",
      password: "Employee@123",
      role: "employee",
      department: "Engineering",
      employeeId: "EMP001",
    },
    {
      name: "Employee Two",
      email: "emp2@atomquest.com",
      password: "Employee@123",
      role: "employee",
      department: "Engineering",
      employeeId: "EMP002",
    },
    {
      name: "Employee Three",
      email: "emp3@atomquest.com",
      password: "Employee@123",
      role: "employee",
      department: "Engineering",
      employeeId: "EMP003",
    },
    {
      name: "Employee Four",
      email: "emp4@atomquest.com",
      password: "Employee@123",
      role: "employee",
      department: "Product",
      employeeId: "EMP004",
    },
    {
      name: "Employee Five",
      email: "emp5@atomquest.com",
      password: "Employee@123",
      role: "employee",
      department: "Product",
      employeeId: "EMP005",
    },
    {
      name: "Employee Six",
      email: "emp6@atomquest.com",
      password: "Employee@123",
      role: "employee",
      department: "Product",
      employeeId: "EMP006",
    },
  ];

  const userMap = new Map();

  // Create users with their individual passwords hashed
  const usersWithHashedPasswords = await Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
      provider: "credentials",
      isActive: true,
    }))
  );

  const createdUsers = await User.insertMany(usersWithHashedPasswords);

  // Map emails to IDs
  createdUsers.forEach((user) => {
    userMap.set(user.email, user._id.toString());
  });

  // Update manager references for employees
  const manager1Id = userMap.get("manager1@atomquest.com");
  const manager2Id = userMap.get("manager2@atomquest.com");

  await User.updateMany(
    { email: { $in: ["emp1@atomquest.com", "emp2@atomquest.com", "emp3@atomquest.com"] } },
    { managerId: manager1Id }
  );

  await User.updateMany(
    { email: { $in: ["emp4@atomquest.com", "emp5@atomquest.com", "emp6@atomquest.com"] } },
    { managerId: manager2Id }
  );

  console.log("✓ Created 9 users (1 admin, 2 managers, 6 employees)");
  return userMap;
}

async function seedGoalCycle(userMap) {
  const adminId = userMap.get("admin@atomquest.com");
  const now = new Date();
  const currentYear = now.getFullYear();

  const cycle = await GoalCycle.create({
    name: `FY ${currentYear}-${currentYear + 1}`,
    year: currentYear,
    phase1Open: new Date(currentYear, 0, 1),
    q1Open: new Date(currentYear, 2, 1),
    q2Open: new Date(currentYear, 5, 1),
    q3Open: new Date(currentYear, 8, 1),
    q4Open: new Date(currentYear, 10, 1),
    isActive: true,
    createdBy: adminId,
  });

  console.log("✓ Created active goal cycle");
  return cycle._id.toString();
}

async function seedGoalSheets(userMap, cycleId) {
  const employees = [
    "emp1@atomquest.com",
    "emp2@atomquest.com",
    "emp3@atomquest.com",
    "emp4@atomquest.com",
    "emp5@atomquest.com",
    "emp6@atomquest.com",
  ];

  const statuses = ["draft", "submitted", "approved", "returned"];
  const goalSheets = [];

  for (let i = 0; i < employees.length; i++) {
    const employeeId = userMap.get(employees[i]);
    const status = statuses[i % statuses.length];
    const now = new Date();

    const sheet = {
      employeeId,
      cycleId,
      status,
      goals: [
        {
          thrustArea: "Product Excellence",
          title: "Improve API Performance",
          description: "Reduce API response time by 30%",
          uomType: "numeric_max",
          target: 30,
          weightage: 25,
          isShared: false,
          achievements: [
            {
              quarter: "Q1",
              actual: 15,
              status: "on_track",
              progressScore: 50,
            },
          ],
          status: "on_track",
        },
        {
          thrustArea: "Team Development",
          title: "Mentor Junior Developers",
          description: "Mentor 2 junior developers",
          uomType: "numeric_min",
          target: 2,
          weightage: 20,
          isShared: false,
          achievements: [
            {
              quarter: "Q1",
              actual: 1,
              status: "on_track",
              progressScore: 50,
            },
          ],
          status: "on_track",
        },
        {
          thrustArea: "Innovation",
          title: "Complete Certification",
          description: "Complete AWS Solutions Architect certification",
          uomType: "zero",
          target: 1,
          weightage: 15,
          isShared: false,
          achievements: [
            {
              quarter: "Q1",
              actual: 0,
              status: "not_started",
              progressScore: 0,
            },
          ],
          status: "not_started",
        },
        {
          thrustArea: "Customer Focus",
          title: "Customer Satisfaction",
          description: "Achieve 90% customer satisfaction score",
          uomType: "numeric_max",
          target: 90,
          weightage: 40,
          isShared: false,
          achievements: [
            {
              quarter: "Q1",
              actual: 85,
              status: "on_track",
              progressScore: 94,
            },
          ],
          status: "on_track",
        },
        {
          thrustArea: "Operational Excellence",
          title: "Reduce Bug Count",
          description: "Reduce production bugs by 40%",
          uomType: "numeric_max",
          target: 40,
          weightage: 20,
          isShared: false,
          achievements: [
            {
              quarter: "Q1",
              actual: 25,
              status: "on_track",
              progressScore: 62,
            },
          ],
          status: "on_track",
        },
        {
          thrustArea: "Knowledge Sharing",
          title: "Conduct Technical Workshops",
          description: "Conduct 4 technical workshops for the team",
          uomType: "numeric_min",
          target: 4,
          weightage: 15,
          isShared: false,
          achievements: [
            {
              quarter: "Q1",
              actual: 1,
              status: "on_track",
              progressScore: 25,
            },
          ],
          status: "on_track",
        },
      ],
      submittedAt: status !== "draft" ? new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) : undefined,
      approvedAt: status === "approved" ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : undefined,
    };

    goalSheets.push(sheet);
  }

  await GoalSheet.insertMany(goalSheets);
  console.log("✓ Created 6 goal sheets with various statuses");
}

async function seedCheckIns(userMap, cycleId) {
  const employees = ["emp1@atomquest.com", "emp2@atomquest.com", "emp3@atomquest.com"];

  const checkIns = [];

  for (const email of employees) {
    const employeeId = userMap.get(email);
    const managerId = email.includes("emp1") || email.includes("emp2") || email.includes("emp3")
      ? userMap.get("manager1@atomquest.com")
      : userMap.get("manager2@atomquest.com");

    // Get the goal sheet for this employee
    const goalSheet = await GoalSheet.findOne({ employeeId, cycleId });
    if (!goalSheet) continue;

    checkIns.push({
      goalSheetId: goalSheet._id,
      managerId,
      employeeId,
      quarter: "Q1",
      comment: "Good progress on API performance improvements. Keep up the momentum.",
      checkInDate: new Date(),
      cycleId,
    });
  }

  await CheckIn.insertMany(checkIns);
  console.log("✓ Created Q1 check-ins for 3 employees");
}

async function main() {
  try {
    await connectDB();
    await clearDatabase();

    const userMap = await seedUsers();
    const cycleId = await seedGoalCycle(userMap);
    await seedGoalSheets(userMap, cycleId);
    await seedCheckIns(userMap, cycleId);

    console.log("\n✓ Database seeding completed successfully!\n");

    // Print credentials table
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("LOGIN CREDENTIALS FOR TESTING");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const credentials = [
      { Role: "Admin", Email: "admin@atomquest.com", Password: "Admin@123" },
      { Role: "Manager", Email: "manager1@atomquest.com", Password: "Manager@123" },
      { Role: "Manager", Email: "manager2@atomquest.com", Password: "Manager@123" },
      { Role: "Employee", Email: "emp1@atomquest.com", Password: "Employee@123" },
      { Role: "Employee", Email: "emp2@atomquest.com", Password: "Employee@123" },
      { Role: "Employee", Email: "emp3@atomquest.com", Password: "Employee@123" },
      { Role: "Employee", Email: "emp4@atomquest.com", Password: "Employee@123" },
      { Role: "Employee", Email: "emp5@atomquest.com", Password: "Employee@123" },
      { Role: "Employee", Email: "emp6@atomquest.com", Password: "Employee@123" },
    ];

    console.table(credentials);

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("DEMO DATA CREATED:");
    console.log("  • 1 Admin user");
    console.log("  • 2 Managers (Engineering & Product)");
    console.log("  • 6 Employees (3 per manager)");
    console.log("  • 1 Active Goal Cycle (FY " + new Date().getFullYear() + "-" + (new Date().getFullYear() + 1) + ")");
    console.log("  • 6 Goal Sheets (various statuses)");
    console.log("  • Q1 Check-ins for 3 employees");
    console.log("═══════════════════════════════════════════════════════════════\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("✗ Seeding failed:", error.message);
    process.exit(1);
  }
}

main();
