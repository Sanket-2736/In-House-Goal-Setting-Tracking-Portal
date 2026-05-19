import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";

/**
 * PUT /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await connectDB();

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (notification.userId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    notification.isRead = true;
    await notification.save();

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}
