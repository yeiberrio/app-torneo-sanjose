import { Capacitor } from "@capacitor/core";
import api from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const isNativeApp = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

/**
 * Descarga un archivo de la API.
 * - Web: blob + enlace de descarga.
 * - App Android/iOS: abre la URL en el navegador del sistema (el WebView no maneja descargas).
 *   Solo aplica a endpoints publicos (plantillas y exportacion Excel).
 */
export async function downloadFile(url: string, filename: string) {
  if (isNativeApp()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: `${API_URL}${url}` });
    return;
  }
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
