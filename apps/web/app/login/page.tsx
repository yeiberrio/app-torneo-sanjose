"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Bienvenido a SportManager Pro");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al iniciar sesion");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - FIFA-style player cover */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0b0f1a]">
        {/* Dark radial background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a2744_0%,_#0b0f1a_70%)]" />

        {/* Decorative circles (EA FC style) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[600px] h-[600px] border border-white/[0.03] rounded-full" />
          <div className="absolute -top-40 -left-40 w-[900px] h-[900px] border border-white/[0.02] rounded-full" />
          <div className="absolute top-1/4 right-0 w-40 h-[120%] bg-gradient-to-b from-green-500/5 via-green-400/8 to-transparent -rotate-12 blur-2xl" />
        </div>

        {/* Player composition - layered like FIFA cover (NATIONAL TEAM jerseys) */}
        <div className="absolute inset-0 flex items-end justify-center">
          {/* Messi (Argentina) - far left */}
          <div className="absolute left-0 bottom-0 w-[32%] h-[70%] z-10">
            <img src="https://r2.thesportsdb.com/images/media/player/render/3dlkuh1691420623.png" alt="Messi" className="w-full h-full object-contain object-bottom opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f1a]/90 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-[#0b0f1a]/70" />
          </div>

          {/* Cristiano (Portugal) - far right */}
          <div className="absolute right-0 bottom-0 w-[32%] h-[70%] z-10">
            <img src="https://r2.thesportsdb.com/images/media/player/render/5iwvee1741981685.png" alt="Cristiano Ronaldo" className="w-full h-full object-contain object-bottom opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-l from-[#0b0f1a]/90 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-[#0b0f1a]/70" />
          </div>

          {/* Mbappé (France) - left mid */}
          <div className="absolute left-[12%] bottom-0 w-[28%] h-[80%] z-20">
            <img src="https://r2.thesportsdb.com/images/media/player/render/4eikfb1723707377.png" alt="Mbappé" className="w-full h-full object-contain object-bottom opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-[#0b0f1a]/50" />
          </div>

          {/* Vinícius (Brazil) - right mid */}
          <div className="absolute right-[12%] bottom-0 w-[28%] h-[80%] z-20">
            <img src="https://r2.thesportsdb.com/images/media/player/render/73s1nu1751450397.png" alt="Vinícius Jr" className="w-full h-full object-contain object-bottom opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-[#0b0f1a]/50" />
          </div>

          {/* LUIS DÍAZ (Colombia) - CENTER HERO */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[48%] h-[92%] z-30">
            <img src="https://r2.thesportsdb.com/images/media/player/render/yxu5001735806350.png" alt="Luis Díaz" className="w-full h-full object-contain object-bottom" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-transparent" />
          </div>
        </div>

        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0b0f1a] to-transparent pointer-events-none z-30" />

        {/* Bottom branding */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-40 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a]/90 to-transparent pt-24">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SportManager Pro</h2>
              <p className="text-green-400 text-xs">Mundial 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-[#0a1628] px-6 py-12 relative">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Sport<span className="text-green-400">Manager</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Link href="/" className="hidden lg:inline-flex items-center gap-1 text-sm text-white/40 hover:text-white/70 mb-8 transition-colors">
            ← Volver al inicio
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenido de vuelta</h1>
            <p className="text-white/40">Ingresa a tu cuenta para gestionar torneos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-green-400/50 focus:ring-green-400/20 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-green-400/50 focus:ring-green-400/20 h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-green-500/25 transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Ingresando..." : "Iniciar sesion"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-white/30 text-sm">No tienes cuenta? </span>
            <Link href="/register" className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
              Registrate gratis
            </Link>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <p className="text-xs text-white/20">SportManager Pro - Mundial 2026</p>
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
