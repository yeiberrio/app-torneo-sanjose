import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const palette = ["bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-amber-100 text-amber-700", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700", "bg-indigo-100 text-indigo-700", "bg-orange-100 text-orange-700"];

export function TeamAvatar({ name, logoUrl, size = "md", className }: { name: string; logoUrl?: string | null; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizes = { xs: "h-6 w-6 text-[9px]", sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base", xl: "h-20 w-20 text-xl" };
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = palette[hash % palette.length];
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={cn("rounded-full object-cover shrink-0 bg-white ring-1 ring-border", sizes[size], className)} />;
  }
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold shrink-0 ring-1 ring-border/50 dark:bg-opacity-20", sizes[size], color, className)}>
      {initials(name)}
    </div>
  );
}
