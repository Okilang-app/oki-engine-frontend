"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserMenu } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Users,
  Film,
  Megaphone,
  Briefcase,
  Languages,
  ClipboardCheck,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Video,
} from "lucide-react";

const nav = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Creators", href: "/creators", icon: Users },
  { name: "Assets", href: "/assets", icon: Film },
  { name: "Ads", href: "/ads", icon: Megaphone },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Translation", href: "/translation", icon: Languages },
  { name: "Review", href: "/review", icon: ClipboardCheck },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Video className="mr-2 h-6 w-6 text-sidebar-primary" />
        <span className="font-semibold text-sidebar-primary-foreground">Oki Engine</span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="mb-2 text-xs text-muted-foreground">
          {user?.name} · {user?.role}
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="hidden w-64 lg:block">
        <Sidebar />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <span className="ml-3 font-semibold">Oki Engine</span>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
