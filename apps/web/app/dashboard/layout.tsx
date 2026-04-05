"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Swords,
  BarChart3,
  Menu,
  X,
  LogOut,
  Shield,
  UserCircle,
  AlertTriangle,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, roles: [] },
  { href: "/dashboard/tournaments", label: "Torneos", icon: Trophy, roles: [] },
  { href: "/dashboard/teams", label: "Equipos", icon: Shield, roles: [] },
  { href: "/dashboard/players", label: "Jugadores", icon: Users, roles: [] },
  { href: "/dashboard/matches", label: "Partidos", icon: Swords, roles: [] },
  { href: "/dashboard/statistics", label: "Estadisticas", icon: BarChart3, roles: [] },
  { href: "/dashboard/sanctions", label: "Sanciones", icon: AlertTriangle, roles: [] },
  { href: "/dashboard/news", label: "Noticias", icon: Newspaper, roles: [] },
  { href: "/dashboard/admin", label: "Administracion", icon: UserCircle, roles: ["SUPER_ADMIN", "ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const filteredNav = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#0a1628]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0d1f3c] border-b border-white/10 z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="ml-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <Trophy className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">SportManager Pro</span>
        </div>
      </div>

      {/* Sidebar overlay with fade */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#0d1f3c] z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">SportManager <span className="text-green-400">Pro</span></h1>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Gestion de Torneos</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/20 font-semibold px-3 mb-2 mt-2">Menu principal</p>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 border border-green-500/20 shadow-sm scale-[1.02]"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent hover:translate-x-1"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-green-400" : ""}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0d1f3c]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-400/20 to-green-600/20 border border-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/30 hover:text-white hover:bg-white/5 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
