import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as RssParser from 'rss-parser';

interface FeedSource {
  url: string;
  name: string;
  category: 'GENERAL' | 'MATCH_RECAP' | 'TRANSFER' | 'TOURNAMENT' | 'ANNOUNCEMENT';
  group: 'mundial' | 'colombia';
}

const FEED_SOURCES: FeedSource[] = [
  // --- MUNDIAL 2026 (10 noticias) ---
  {
    url: 'https://news.google.com/rss/search?q=mundial+2026+futbol+FIFA&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Mundial 2026',
    category: 'TOURNAMENT',
    group: 'mundial',
  },
  {
    url: 'https://news.google.com/rss/search?q=eliminatorias+sudamericanas+mundial+2026+conmebol&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Eliminatorias',
    category: 'TOURNAMENT',
    group: 'mundial',
  },
  {
    url: 'https://news.google.com/rss/search?q=messi+OR+cristiano+ronaldo+OR+mbapp%C3%A9+OR+vinicius+mundial&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Estrellas Mundialistas',
    category: 'GENERAL',
    group: 'mundial',
  },
  {
    url: 'https://news.google.com/rss/search?q=FIFA+world+cup+2026+sedes+grupos&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Sedes y Grupos',
    category: 'ANNOUNCEMENT',
    group: 'mundial',
  },
  // --- FUTBOL PROFESIONAL COLOMBIANO (5 noticias) ---
  {
    url: 'https://news.google.com/rss/search?q=seleccion+colombia+futbol+nestor+lorenzo&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Seleccion Colombia',
    category: 'TOURNAMENT',
    group: 'colombia',
  },
  {
    url: 'https://news.google.com/rss/search?q=luis+diaz+OR+james+rodriguez+seleccion+colombia&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Luis Diaz y James',
    category: 'TRANSFER',
    group: 'colombia',
  },
  {
    url: 'https://news.google.com/rss/search?q=liga+betplay+futbol+colombiano+2026&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Liga BetPlay',
    category: 'MATCH_RECAP',
    group: 'colombia',
  },
];

const KEYWORDS_MUNDIAL = [
  'mundial', 'world cup', '2026', 'fifa', 'eliminatoria', 'clasificacion',
  'messi', 'cristiano', 'ronaldo', 'mbappé', 'mbappe', 'vinicius',
  'conmebol', 'concacaf', 'uefa', 'seleccion', 'sorteo', 'sede',
  'grupo', 'fixture', 'repechaje', 'estados unidos', 'mexico', 'canada',
];

const KEYWORDS_COLOMBIA = [
  'colombia', 'seleccion colombia', 'tricolor', 'luis diaz', 'james',
  'nestor lorenzo', 'betplay', 'liga colombiana', 'dimayor',
  'millonarios', 'nacional', 'america de cali', 'junior', 'santa fe',
  'cali', 'medellin', 'duvan zapata', 'richard rios', 'jhon arias',
  'juan fernando quintero', 'eliminatoria', 'barranquilla',
];

@Injectable()
export class NewsScraperService {
  private readonly logger = new Logger(NewsScraperService.name);
  private parser: RssParser;

  constructor(private prisma: PrismaService) {
    this.parser = new RssParser({
      timeout: 10000,
      headers: {
        'User-Agent': 'SportManager-Pro/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
  }

  async scrapeNews(): Promise<{ created: number; skipped: number; mundial: number; colombia: number }> {
    this.logger.log('Starting news scraping (10 mundial + 5 colombia)...');
    let skipped = 0;
    let mundialCount = 0;
    let colombiaCount = 0;

    const admin = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!admin) {
      this.logger.warn('No admin user found, skipping scraping');
      return { created: 0, skipped: 0, mundial: 0, colombia: 0 };
    }

    // Process each feed source
    for (const source of FEED_SOURCES) {
      const maxForGroup = source.group === 'mundial' ? 10 : 5;
      const currentCount = source.group === 'mundial' ? mundialCount : colombiaCount;

      if (currentCount >= maxForGroup) continue;

      try {
        const feed = await this.parser.parseURL(source.url);
        const items = (feed.items || []).slice(0, 15);

        for (const item of items) {
          // Recheck limits
          if (source.group === 'mundial' && mundialCount >= 10) break;
          if (source.group === 'colombia' && colombiaCount >= 5) break;

          const title = this.cleanTitle(item.title || '');
          if (!title || title.length < 15) continue;

          // Check relevance with group-specific keywords
          const keywords = source.group === 'mundial' ? KEYWORDS_MUNDIAL : KEYWORDS_COLOMBIA;
          const textToCheck = `${title} ${item.contentSnippet || ''}`.toLowerCase();
          const isRelevant = keywords.some((kw) => textToCheck.includes(kw));

          if (!isRelevant) {
            skipped++;
            continue;
          }

          // Deduplicate: check by title similarity in last 72 hours
          const exists = await this.prisma.news.findFirst({
            where: {
              title: { contains: title.substring(0, 40), mode: 'insensitive' },
              createdAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
            },
          });

          if (exists) {
            skipped++;
            continue;
          }

          const summary = this.cleanContent(item.contentSnippet || item.content || '');
          const content = this.buildContent(item, source.name);
          const imageUrl = this.extractImage(item, source.group);

          await this.prisma.news.create({
            data: {
              title,
              summary: summary.substring(0, 300) || null,
              content,
              imageUrl,
              category: source.category as any,
              status: 'PUBLISHED',
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
              authorId: admin.id,
            },
          });

          if (source.group === 'mundial') mundialCount++;
          else colombiaCount++;
        }
      } catch (err) {
        this.logger.warn(`Failed to scrape ${source.name}: ${(err as Error).message}`);
      }
    }

    const total = mundialCount + colombiaCount;
    this.logger.log(`Scraping complete: ${total} created (${mundialCount} mundial, ${colombiaCount} colombia), ${skipped} skipped`);
    return { created: total, skipped, mundial: mundialCount, colombia: colombiaCount };
  }

  private cleanTitle(title: string): string {
    return title.replace(/\s*-\s*[^-]+$/, '').trim();
  }

  private cleanContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractRealUrl(item: RssParser.Item): string | null {
    // Google News RSS includes the real source URL inside the <a> tags in content
    const content = item.content || '';
    const hrefMatch = content.match(/<a[^>]+href="(https?:\/\/(?!news\.google\.com)[^"]+)"/);
    if (hrefMatch) return hrefMatch[1];

    // If the link is not a Google News redirect, use it directly
    const link = item.link || '';
    if (link && !link.includes('news.google.com/rss/articles')) return link;

    return null;
  }

  private buildContent(item: RssParser.Item, sourceName: string): string {
    const snippet = this.cleanContent(item.contentSnippet || item.content || '');
    const realUrl = this.extractRealUrl(item);
    const date = item.pubDate
      ? new Date(item.pubDate).toLocaleDateString('es-CO', { dateStyle: 'long' })
      : '';

    // Extract source name from the snippet (Google News often appends it)
    const sourceFromContent = item.contentSnippet?.match(/([^.]+)$/)?.[0]?.trim();

    return [
      snippet,
      '',
      `Fuente: ${sourceFromContent || sourceName}`,
      date ? `Fecha: ${date}` : '',
      realUrl ? `Leer mas: ${realUrl}` : '',
    ].filter(Boolean).join('\n');
  }

  private extractImage(item: RssParser.Item, group: string): string | null {
    const content = item.content || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];

    const enclosure = (item as any).enclosure;
    if (enclosure?.url && enclosure.type?.startsWith('image')) {
      return enclosure.url;
    }

    // Group-specific default images
    const mundialImages = [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
    ];

    const colombiaImages = [
      'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
      'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800&q=80',
      'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80',
    ];

    const images = group === 'mundial' ? mundialImages : colombiaImages;
    return images[Math.floor(Math.random() * images.length)];
  }
}
