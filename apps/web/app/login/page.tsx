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
      {/* Left panel - Player collage with Luis Díaz as hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a1628]">
        {/* Stadium ambient background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80')` }}
        />

        {/* Player grid: Luis Díaz center + stars around */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top row - 3 players */}
          <div className="flex h-[35%]">
            <div className="w-1/3 relative overflow-hidden border-r border-b border-white/5">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/440px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg" alt="Messi" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 bg-blue-500/60 px-1.5 py-0.5 rounded">ARG</span>
            </div>
            <div className="w-1/3 relative overflow-hidden border-r border-b border-white/5">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg" alt="Cristiano" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 bg-red-600/60 px-1.5 py-0.5 rounded">POR</span>
            </div>
            <div className="w-1/3 relative overflow-hidden border-b border-white/5">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg/440px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg" alt="Mbappé" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 bg-blue-700/60 px-1.5 py-0.5 rounded">FRA</span>
            </div>
          </div>

          {/* Center - LUIS DÍAZ hero (biggest) */}
          <div className="h-[40%] relative overflow-hidden border-b border-white/5">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Luis_D%C3%ADaz_2024_%28cropped%29.jpg/440px-Luis_D%C3%ADaz_2024_%28cropped%29.jpg" alt="Luis Díaz" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-red-500/10" />
            {/* Colombia flag bar */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="flex-[2] bg-yellow-400" />
              <div className="flex-1 bg-blue-600" />
              <div className="flex-1 bg-red-600" />
            </div>
            <div className="absolute bottom-4 left-5 right-5">
              <p className="text-2xl font-black text-white tracking-tight">LUIS DÍAZ</p>
              <p className="text-sm text-yellow-400 font-semibold">Colombia | #7</p>
            </div>
          </div>

          {/* Bottom row - 3 players */}
          <div className="flex h-[25%]">
            <div className="w-1/3 relative overflow-hidden border-r border-white/5">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Vin%C3%ADcius_J%C3%BAnior_2024.jpg/440px-Vin%C3%ADcius_J%C3%BAnior_2024.jpg" alt="Vinícius Jr" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 bg-green-600/60 px-1.5 py-0.5 rounded">BRA</span>
            </div>
            <div className="w-1/3 relative overflow-hidden border-r border-white/5">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/James_Rodriguez_2024.jpg/440px-James_Rodriguez_2024.jpg" alt="James Rodríguez" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 bg-yellow-500/60 px-1.5 py-0.5 rounded">COL</span>
            </div>
            <div className="w-1/3 relative overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Erling_Haaland_2023_%28cropped%29.jpg/440px-Erling_Haaland_2023_%28cropped%29.jpg" alt="Haaland" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 bg-red-500/60 px-1.5 py-0.5 rounded">NOR</span>
            </div>
          </div>
        </div>

        {/* Overlay gradients for blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a1628]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-[#0a1628]/40 pointer-events-none" />

        {/* Bottom branding */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SportManager Pro</h2>
              <p className="text-green-400 text-xs">Mundial 2026 - La fiesta del futbol</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-[#0a1628] px-6 py-12 relative">
        {/* Subtle pattern */}
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
