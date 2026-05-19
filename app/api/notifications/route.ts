import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";

/**
 * GET /api/notifications
 * Get unread notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectDB();

    const notifications = await Notification.find({
      userId: user.id,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      userId: user.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}
