import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    await connectDB();

    const result = await Notification.updateMany(
      { userId: user.id, isRead: false },
      { isRead: true }
    );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}
