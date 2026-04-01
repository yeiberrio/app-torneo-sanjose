"use client";

import Link from "next/link";
import Image from "next/image";
import { Trophy, Users, Swords, BarChart3, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const worldStars = [
  {
    name: "Luis Díaz",
    team: "Colombia",
    pos: "Extremo",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Luis_D%C3%ADaz_2024_%28cropped%29.jpg/440px-Luis_D%C3%ADaz_2024_%28cropped%29.jpg",
  },
  {
    name: "James Rodríguez",
    team: "Colombia",
    pos: "Mediocampista",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/James_Rodriguez_2024.jpg/440px-James_Rodriguez_2024.jpg",
  },
  {
    name: "Lionel Messi",
    team: "Argentina",
    pos: "Delantero",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/440px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg",
  },
  {
    name: "Cristiano Ronaldo",
    team: "Portugal",
    pos: "Delantero",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg",
  },
  {
    name: "Kylian Mbappé",
    team: "Francia",
    pos: "Delantero",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg/440px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg",
  },
  {
    name: "Vinícius Jr.",
    team: "Brasil",
    pos: "Extremo",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Vin%C3%ADcius_J%C3%BAnior_2024.jpg/440px-Vin%C3%ADcius_J%C3%BAnior_2024.jpg",
  },
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
      {/* Hero Section with World Cup stadium background */}
      <div className="relative min-h-screen flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/75 to-[#0a1628]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />

        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 via-yellow-400 to-green-400 opacity-60" />

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
            <span className="text-sm text-green-300 font-medium">Mundial 2026 - USA, Mexico & Canada</span>
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

      {/* World Stars Section - with REAL PHOTOS */}
      <section className="relative py-24 px-6 md:px-12 bg-gradient-to-b from-[#0a1628] to-[#0d1f3c]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Estrellas Mundialistas</span>
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Las figuras del <span className="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">Mundial 2026</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">
              Inspirados en los mejores del mundo. El futbol se vive con pasion.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {worldStars.map((star) => (
              <div
                key={star.name}
                className="group relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-green-400/40 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10"
              >
                {/* Player photo */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={star.img}
                    alt={star.name}
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
                  {/* Country flag accent */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <span className="text-[10px] font-bold text-white/80">{star.team}</span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4 relative">
                  <p className="font-bold text-sm text-white group-hover:text-green-400 transition-colors">{star.name}</p>
                  <p className="text-xs text-green-400/60 mt-1">{star.pos}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner - Colombia World Cup */}
      <section className="relative py-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/80 via-blue-700/80 to-red-600/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h3 className="text-3xl md:text-4xl font-black mb-3">VAMOS COLOMBIA!</h3>
          <p className="text-white/90 text-lg">La Tricolor suena fuerte rumbo al Mundial 2026</p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-4xl font-black">10</p>
              <p className="text-xs text-white/60 uppercase">James</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black">7</p>
              <p className="text-xs text-white/60 uppercase">Luis Díaz</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black">9</p>
              <p className="text-xs text-white/60 uppercase">Duván Zapata</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6 md:px-12 bg-[#0a1628]">
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
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-16">
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
