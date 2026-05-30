import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/user/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    await connectDB();

    const userData = await User.findById(new Types.ObjectId(user.id)).select(
      "name email department phone timezone emailNotifications pushNotifications role"
    );

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: userData.name,
        email: userData.email,
        department: userData.department,
        phone: userData.phone,
        timezone: userData.timezone || "UTC",
        emailNotifications: userData.emailNotifications !== false,
        pushNotifications: userData.pushNotifications !== false,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
