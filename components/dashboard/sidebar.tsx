"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  TrendingUp,
  Users,
  FileCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Users2,
  Zap,
  Share2,
  History,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  session: Session;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationByRole = {
  employee: [
    { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { label: "My Goals", href: "/employee/goals", icon: Target },
    { label: "Quarterly Check-in", href: "/employee/checkin", icon: CheckSquare },
    { label: "My Progress", href: "/employee/progress", icon: TrendingUp },
  ],
  manager: [
    { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
    { label: "Team Goals", href: "/manager/team-goals", icon: Share2 },
    { label: "Approvals", href: "/manager/approvals", icon: FileCheck },
    { label: "Team Check-ins", href: "/manager/checkins", icon: CheckSquare },
    { label: "Reports", href: "/manager/reports", icon: BarChart3 },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Goal Cycles", href: "/admin/cycles", icon: Zap },
    { label: "Shared Goals", href: "/admin/shared-goals", icon: Share2 },
    { label: "Achievement Report", href: "/admin/reports", icon: BarChart3 },
    { label: "Completion Dashboard", href: "/admin/reports/completion", icon: CheckSquare },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Audit Trail", href: "/admin/audit", icon: History },
  ],
};

export function Sidebar({ session, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const role = (session?.user as any)?.role || "employee";
  const navItems = navigationByRole[role as keyof typeof navigationByRole] || navigationByRole.employee;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => {
    // Find the nav item with the longest href that matches the current pathname
    const matchingItems = navItems.filter(item => 
      pathname === item.href || pathname.startsWith(item.href + "/")
    );
    
    // Sort by length (descending) to get the most specific match
    matchingItems.sort((a, b) => b.href.length - a.href.length);
    
    // Only return true if this href is the most specific match
    return matchingItems.length > 0 && matchingItems[0].href === href;
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform duration-300 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">AQ</span>
                </div>
                <span className="font-bold text-lg hidden sm:inline">AtomQuest</span>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback>{getInitials(session?.user?.name || "User")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
                <Badge variant="outline" className="mt-1 text-xs capitalize">
                  {role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4 space-y-2">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 transition-colors">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
