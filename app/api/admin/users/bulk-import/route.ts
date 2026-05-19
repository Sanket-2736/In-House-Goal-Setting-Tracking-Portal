import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";

interface CSVRow {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  role: string;
  managerEmail?: string;
}

/**
 * POST /api/admin/users/bulk-import
 * Bulk import users from CSV
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole("admin");
    const body = await request.json();

    const { csvData } = body as { csvData: CSVRow[] };

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json(
        { error: "CSV data is required and must not be empty" },
        { status: 400 }
      );
    }

    await connectDB();

    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        // Validate required fields
        if (!row.name || !row.email || !row.role) {
          results.errors.push(`Row ${i + 1}: Missing required fields (name, email, role)`);
          results.failed++;
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: row.email });
        if (existingUser) {
          results.errors.push(`Row ${i + 1}: User with email ${row.email} already exists`);
          results.failed++;
          continue;
        }

        // Find manager if managerEmail provided
        let managerId = undefined;
        if (row.managerEmail) {
          const manager = await User.findOne({ email: row.managerEmail });
          if (manager) {
            managerId = manager._id;
          } else {
            results.errors.push(
              `Row ${i + 1}: Manager with email ${row.managerEmail} not found`
            );
            results.failed++;
            continue;
          }
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user
        await User.create({
          name: row.name,
          email: row.email,
          employeeId: row.employeeId,
          department: row.department,
          role: (row.role || "employee") as "employee" | "manager" | "admin",
          managerId,
          password: hashedPassword,
          provider: "credentials",
          isActive: true,
        });

        results.created++;
      } catch (error) {
        results.errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.created} users, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    console.error("Error bulk importing users:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
