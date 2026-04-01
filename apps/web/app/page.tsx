"use client";

import Link from "next/link";
import { Trophy, Users, Swords, BarChart3, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const stars = [
  { name: "Luis Díaz", team: "Colombia", pos: "Extremo" },
  { name: "James Rodríguez", team: "Colombia", pos: "Mediocampista" },
  { name: "Cristiano Ronaldo", team: "Portugal", pos: "Delantero" },
  { name: "Lionel Messi", team: "Argentina", pos: "Delantero" },
  { name: "Kylian Mbappé", team: "Francia", pos: "Delantero" },
  { name: "Vinícius Jr.", team: "Brasil", pos: "Extremo" },
];

const features = [
  { icon: Trophy, title: "Torneos", desc: "Crea y gestiona torneos con fixture automatico" },
  { icon: Users, title: "Equipos y Jugadores", desc: "Registro completo con documentos de identidad" },
  { icon: Swords, title: "Partidos en Vivo", desc: "Goles, tarjetas y eventos en tiempo real" },
  { icon: BarChart3, title: "Estadisticas", desc: "Tabla de posiciones, goleadores y sanciones" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a1628] text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/80 to-[#0a1628]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />

        {/* Animated accent lines */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 via-yellow-400 to-green-400 opacity-60" />
        <div className="absolute top-0 left-3 w-0.5 h-full bg-gradient-to-b from-yellow-400 via-green-400 to-yellow-400 opacity-30" />

        {/* Nav */}
        <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Sport<span className="text-green-400">Manager</span> Pro
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
              <Link href="/login">Iniciar Sesion</Link>
            </Button>
            <Button className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25" asChild>
              <Link href="/register">Registrate</Link>
            </Button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 px-6 md:px-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-green-300 font-medium">Mundial 2026 - Se viene la fiesta del futbol</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6">
            <span className="text-white">Gestiona tu</span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-yellow-300 to-green-400 bg-clip-text text-transparent">
              torneo
            </span>
            <br />
            <span className="text-white/90">como un profesional</span>
          </h1>

          <p className="text-lg text-white/60 max-w-lg mb-8 leading-relaxed">
            La plataforma mas completa para administrar torneos de futbol.
            Equipos, fixture, estadisticas y mas. Todo en un solo lugar.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white text-base px-8 shadow-xl shadow-green-500/25 group" asChild>
              <Link href="/login">
                Comenzar ahora
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-base px-8" asChild>
              <Link href="/register">Crear cuenta gratis</Link>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
            <div>
              <p className="text-3xl font-bold text-green-400">17</p>
              <p className="text-sm text-white/40">Equipos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-400">268</p>
              <p className="text-sm text-white/40">Jugadores</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">136</p>
              <p className="text-sm text-white/40">Partidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* World Stars Section */}
      <section className="relative py-20 px-6 md:px-12 bg-gradient-to-b from-[#0a1628] to-[#0d1f3c]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Inspirados en los mejores</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Estrellas del <span className="text-green-400">Mundial 2026</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stars.map((star) => (
              <div
                key={star.name}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-green-400/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/10"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400/20 to-yellow-400/20 flex items-center justify-center mb-3 group-hover:from-green-400/30 group-hover:to-yellow-400/30 transition-all">
                  <span className="text-lg font-bold text-green-400">{star.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <p className="font-bold text-sm text-white">{star.name}</p>
                <p className="text-xs text-white/40 mt-1">{star.team}</p>
                <p className="text-xs text-green-400/60">{star.pos}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6 md:px-12">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80')`,
          }}
        />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-center text-white/50 mb-12 max-w-md mx-auto">
            Herramientas profesionales para gestionar torneos de cualquier nivel
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-4 shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="relative rounded-3xl overflow-hidden p-12 md:p-16"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=80')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-green-800/90" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Listo para comenzar?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Unete a SportManager Pro y lleva la gestion de tu torneo al siguiente nivel
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Button size="lg" className="bg-white text-green-700 hover:bg-white/90 font-bold text-base px-8 shadow-xl" asChild>
                  <Link href="/register">Registrate gratis</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base px-8" asChild>
                  <Link href="/login">Ya tengo cuenta</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-400" />
            <span className="text-sm text-white/40">SportManager Pro - Torneo Futbol 7 San Jose 2026</span>
          </div>
          <p className="text-xs text-white/30">Hecho con pasion por el futbol</p>
        </div>
      </footer>
    </div>
  );
}
