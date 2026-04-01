"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Archive, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

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

export default function NewsDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const newsId = searchParams.get("id");
  const { user } = useAuthStore();
  const canManage = user ? can(user.role, "update", "News") : false;
  const canDelete = user ? can(user.role, "delete", "News") : false;
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = () => {
    if (!newsId) return;
    api.get(`/news/${newsId}`).then((res) => {
      setNews(res.data);
    }).catch(() => toast.error("Error al cargar noticia")).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNews(); }, [newsId]);

  const handlePublish = async () => {
    try {
      await api.patch(`/news/${newsId}/publish`);
      toast.success("Noticia publicada");
      fetchNews();
    } catch {
      toast.error("Error al publicar");
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/news/${newsId}/archive`);
      toast.success("Noticia archivada");
      fetchNews();
    } catch {
      toast.error("Error al archivar");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Seguro que deseas eliminar esta noticia?")) return;
    try {
      await api.delete(`/news/${newsId}`);
      toast.success("Noticia eliminada");
      router.push("/dashboard/news");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <p className="text-muted-foreground p-6">Cargando noticia...</p>;
  if (!news) return <p className="text-muted-foreground p-6">Noticia no encontrada.</p>;

  const st = statusLabels[news.status] || { label: news.status, className: "bg-gray-100" };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/news"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">Detalle de Noticia</h1>
        {canManage && (
          <div className="flex items-center gap-2">
            {news.status === "DRAFT" && (
              <Button size="sm" onClick={handlePublish}>
                <Send className="h-4 w-4 mr-2" />Publicar
              </Button>
            )}
            {news.status === "PUBLISHED" && (
              <Button size="sm" variant="outline" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />Archivar
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />Eliminar
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        {news.imageUrl && (
          <div className="h-64 overflow-hidden rounded-t-lg">
            <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{categoryLabels[news.category] || news.category}</Badge>
            <Badge variant="outline" className={st.className}>{st.label}</Badge>
            {news.tournament && (
              <Badge variant="secondary">{news.tournament.name}</Badge>
            )}
          </div>
          <CardTitle className="text-2xl">{news.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Por {news.author?.firstName} {news.author?.lastName}</span>
            <span>{new Date(news.publishedAt || news.createdAt).toLocaleDateString("es-CO", {
              weekday: "long", day: "2-digit", month: "long", year: "numeric",
            })}</span>
          </div>
        </CardHeader>
        <CardContent>
          {news.summary && (
            <p className="text-lg text-muted-foreground mb-4 italic">{news.summary}</p>
          )}
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {news.content.split('\n').map((line: string, i: number) => {
              const urlMatch = line.match(/^Leer mas:\s*(https?:\/\/.+)$/);
              if (urlMatch) {
                return (
                  <p key={i}>
                    <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                      Leer articulo completo →
                    </a>
                  </p>
                );
              }
              return <span key={i}>{line}{'\n'}</span>;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
