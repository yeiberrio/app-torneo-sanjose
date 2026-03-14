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
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="ml-3 font-semibold text-primary">SportManager Pro</span>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-background border-r z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">SportManager Pro</h1>
          <p className="text-xs text-muted-foreground mt-1">Gestion de Torneos</p>
        </div>

        <nav className="p-2 flex-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
