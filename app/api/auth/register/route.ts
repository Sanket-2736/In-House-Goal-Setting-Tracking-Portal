import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["employee", "manager"]).default("employee"),
  department: z.string().optional(),
  employeeId: z.string().optional(),
});

type RegisterInput = z.infer<typeof registerSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = registerSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({ email: validatedData.email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    if (validatedData.employeeId) {
      const existingEmployeeId = await User.findOne({
        employeeId: validatedData.employeeId,
      });

      if (existingEmployeeId) {
        return NextResponse.json(
          { error: "Employee ID already in use" },
          { status: 409 }
        );
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const newUser = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      employeeId: validatedData.employeeId,
      department: validatedData.department,
      role: validatedData.role,
      provider: "credentials",
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
