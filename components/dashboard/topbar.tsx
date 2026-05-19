"use client";

import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface TopBarProps {
  session: Session;
  cycleName?: string;
  onMenuClick?: () => void;
}

export function TopBar({ session, cycleName, onMenuClick }: TopBarProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left side - Menu button and cycle info */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors dark:hover:bg-muted/50"
          >
            <Menu className="w-5 h-5" />
          </button>
          {cycleName && (
            <div className="hidden sm:block">
              <p className="text-sm text-muted-foreground">Current Cycle</p>
              <p className="text-sm font-semibold">{cycleName}</p>
            </div>
          )}
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback>{getInitials(session?.user?.name || "User")}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
