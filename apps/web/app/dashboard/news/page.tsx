"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Newspaper, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-yellow-100 text-yellow-800" },
  PUBLISHED: { label: "Publicada", className: "bg-green-100 text-green-800" },
  ARCHIVED: { label: "Archivada", className: "bg-gray-100 text-gray-800" },
};

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  MATCH_RECAP: "Resumen de Partido",
  TRANSFER: "Fichaje",
  INJURY: "Lesion",
  TOURNAMENT: "Torneo",
  ANNOUNCEMENT: "Anuncio",
};

export default function NewsPage() {
  const { user } = useAuthStore();
  const canCreate = user ? can(user.role, "create", "News") : false;
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadNews = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    api.get(`/news?${params.toString()}`).then((res) => {
      setNews(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNews();
  }, [statusFilter]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await api.post("/news/scrape");
      toast.success(`${res.data.created} noticias mundialistas importadas`);
      loadNews();
    } catch {
      toast.error("Error al importar noticias");
    } finally {
      setScraping(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Noticias</h1>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="DRAFT">Borradores</SelectItem>
                <SelectItem value="PUBLISHED">Publicadas</SelectItem>
                <SelectItem value="ARCHIVED">Archivadas</SelectItem>
              </SelectContent>
            </Select>
          )}
          {canCreate && (
            <Button variant="outline" onClick={handleScrape} disabled={scraping}>
              <RefreshCw className={`h-4 w-4 mr-2 ${scraping ? "animate-spin" : ""}`} />
              {scraping ? "Importando..." : "Noticias Mundial"}
            </Button>
          )}
          {canCreate && (
            <Button asChild>
              <Link href="/dashboard/news/new"><Plus className="h-4 w-4 mr-2" />Nueva Noticia</Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : news.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay noticias aun.</p>
            {canCreate && (
              <Button className="mt-4" asChild>
                <Link href="/dashboard/news/new">Crear primera noticia</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((n) => {
            const st = statusLabels[n.status] || { label: n.status, className: "bg-gray-100" };
            return (
              <Link key={n.id} href={`/dashboard/news/detalle?id=${n.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  {n.imageUrl && (
                    <div className="h-40 overflow-hidden rounded-t-lg">
                      <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[n.category] || n.category}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${st.className}`}>
                        {st.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-2">{n.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {n.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{n.summary}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{n.author?.firstName} {n.author?.lastName}</span>
                      <span>{new Date(n.publishedAt || n.createdAt).toLocaleDateString("es-CO")}</span>
                    </div>
                    {n.tournament && (
                      <p className="text-xs text-muted-foreground mt-1">{n.tournament.name}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
