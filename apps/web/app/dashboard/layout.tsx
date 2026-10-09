"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useTheme } from "@/lib/theme";
import Link from "next/link";
import {
  LayoutDashboard, Trophy, Users, Swords, BarChart3, Menu, X, LogOut, Shield, UserCircle, AlertTriangle, Newspaper, Moon, Sun, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, roles: [] as string[], mobile: true },
  { href: "/dashboard/tournaments", label: "Torneos", icon: Trophy, roles: [], mobile: true },
  { href: "/dashboard/matches", label: "Partidos", icon: Swords, roles: [], mobile: true },
  { href: "/dashboard/teams", label: "Equipos", icon: Shield, roles: [], mobile: true },
  { href: "/dashboard/players", label: "Jugadores", icon: Users, roles: [], mobile: false },
  { href: "/dashboard/statistics", label: "Estadísticas", icon: BarChart3, roles: [], mobile: false },
  { href: "/dashboard/sanctions", label: "Sanciones", icon: AlertTriangle, roles: [], mobile: false },
  { href: "/dashboard/news", label: "Noticias", icon: Newspaper, roles: [], mobile: false },
  { href: "/dashboard/admin", label: "Administración", icon: UserCircle, roles: ["SUPER_ADMIN", "ADMIN"], mobile: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.length === 0 || item.roles.includes(user.role));
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const mobileNav = filteredNav.filter((i) => i.mobile);
  const moreActive = filteredNav.some((i) => !i.mobile && isActive(i.href));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-[calc(3.5rem+env(safe-area-inset-top))] bg-[#0d1f3c] text-white z-40 flex items-center px-3 gap-2 pt-[env(safe-area-inset-top)]">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center"><Trophy className="h-3.5 w-3.5 text-white" /></div>
          <span className="font-semibold text-sm">SportManager <span className="text-emerald-400">Pro</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-white/70 hover:bg-white/10 hover:text-white h-9 w-9" onClick={toggle} aria-label="Cambiar tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-xs font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 h-full pt-[env(safe-area-inset-top)] lg:pt-0 w-72 lg:w-64 bg-[#0d1f3c] text-white z-50 flex flex-col transform transition-transform duration-200 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Trophy className="h-5 w-5 text-white" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold tracking-tight">SportManager <span className="text-emerald-400">Pro</span></h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Gestión de torneos</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white/70 hover:bg-white/10" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></Button>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-3 mb-2 mt-1">Menú</p>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all duration-150 border", active ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "text-white/60 hover:bg-white/5 hover:text-white border-transparent")}>
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-sm font-bold">{user.firstName[0]}{user.lastName[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 h-8 w-8" onClick={toggle} aria-label="Cambiar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 rounded-xl" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64 pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("h-7 w-10 rounded-full flex items-center justify-center transition-colors", active && "bg-primary/10")}><Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" /></div>
                {item.label}
              </Link>
            );
          })}
          <button onClick={() => setSidebarOpen(true)} className={cn("flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium", moreActive ? "text-primary" : "text-muted-foreground")}>
            <div className={cn("h-7 w-10 rounded-full flex items-center justify-center", moreActive && "bg-primary/10")}><MoreHorizontal className="h-[18px] w-[18px]" /></div>
            Más
          </button>
        </div>
      </nav>
    </div>
  );
}
