"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface Notification {
  _id: string;
  type: "approval" | "return" | "comment" | "escalation";
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  createdAt: string;
}

const notificationLinks: Record<string, (id: string) => string> = {
  goal_sheet: (id) => `/manager/approvals/${id}`,
  checkin: (id) => `/manager/checkins/${id}`,
  escalation: (id) => `/admin/escalations`,
};

const notificationIcons: Record<string, React.ReactNode> = {
  approval: <Check className="w-4 h-4 text-green-600" />,
  return: <AlertCircle className="w-4 h-4 text-orange-600" />,
  comment: <Bell className="w-4 h-4 text-blue-600" />,
  escalation: <AlertCircle className="w-4 h-4 text-red-600" />,
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.relatedEntityType && notification.relatedEntityId) {
      const linkFn = notificationLinks[notification.relatedEntityType];
      if (linkFn) {
        return linkFn(notification.relatedEntityId);
      }
    }
    return "#";
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <Link
                key={notification._id}
                href={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification._id);
                  }
                  setOpen(false);
                }}
              >
                <div
                  className={`px-4 py-3 border-b hover:bg-muted cursor-pointer transition-colors dark:hover:bg-muted/50 ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {notificationIcons[notification.type] || (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(notification.createdAt), "MMM dd, h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
