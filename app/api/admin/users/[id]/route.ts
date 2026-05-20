import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import bcrypt from "bcryptjs";

/**
 * PATCH /api/admin/users/[id]
 * Update a specific user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("PATCH /api/admin/users/[id] - Starting update");
    console.log("User ID:", params.id);
    
    await requireRole("admin");
    console.log("Admin role verified");
    
    const body = await request.json();
    console.log("Request body:", body);
    
    const { isActive, password, ...otherFields } = body;

    await connectDB();
    console.log("Database connected");

    const updateData: any = { ...otherFields };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
      console.log("Setting isActive to:", isActive);
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      console.log("Password hashed");
    }

    console.log("Update data:", updateData);
    console.log("Finding and updating user with ID:", params.id);

    const user = await User.findByIdAndUpdate(params.id, updateData, {
      new: true,
    });

    if (!user) {
      console.error("User not found with ID:", params.id);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User updated successfully:", user._id);

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a specific user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("admin");

    await connectDB();

    const user = await User.findByIdAndDelete(params.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
