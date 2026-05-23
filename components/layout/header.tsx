"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/components/providers/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { DashboardUser } from "@/lib/dashboard/mock-data";
import { roleLabel } from "@/lib/dashboard/role-config";
import { logoutUser } from "@/lib/auth/client";
import type { SystemRoleSlug } from "@/lib/auth/constants";
import { NotificationCenter } from "@/components/notifications/notification-center";

interface HeaderProps {
  user: DashboardUser;
  availableRoles: SystemRoleSlug[];
  onMenuClick: () => void;
  onRoleChange: (role: SystemRoleSlug) => void;
}

export function Header({
  user,
  availableRoles,
  onMenuClick,
  onRoleChange,
}: HeaderProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [roleOpen, setRoleOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    await logoutUser();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search workflows, invoices, people..."
          className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <NotificationCenter />

        <div className="relative hidden sm:block">
          {availableRoles.length > 1 ? (
            <button
              type="button"
              onClick={() => setRoleOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted"
            >
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{roleLabel(user.role)}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="rounded-lg border border-border px-2 py-1.5 text-xs font-medium">
              {roleLabel(user.role)}
            </div>
          )}
          {roleOpen && availableRoles.length > 1 && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                onClick={() => setRoleOpen(false)}
              />
              <ul className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                {availableRoles.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                        r === user.role && "bg-accent font-medium",
                      )}
                      onClick={() => {
                        onRoleChange(r);
                        setRoleOpen(false);
                      }}
                    >
                      {roleLabel(r)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
          <Avatar initials={user.avatarInitials} />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user.organization}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          disabled={loggingOut}
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
