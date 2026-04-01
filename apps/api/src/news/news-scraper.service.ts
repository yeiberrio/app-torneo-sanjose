import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as RssParser from 'rss-parser';

interface FeedSource {
  url: string;
  name: string;
  category: 'GENERAL' | 'MATCH_RECAP' | 'TRANSFER' | 'TOURNAMENT' | 'ANNOUNCEMENT';
}

const FEED_SOURCES: FeedSource[] = [
  {
    url: 'https://news.google.com/rss/search?q=seleccion+colombia+futbol+mundial+2026&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Colombia Mundial',
    category: 'TOURNAMENT',
  },
  {
    url: 'https://news.google.com/rss/search?q=mundial+2026+futbol&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Mundial 2026',
    category: 'GENERAL',
  },
  {
    url: 'https://news.google.com/rss/search?q=luis+diaz+OR+james+rodriguez+OR+colombia+eliminatorias&hl=es-419&gl=CO&ceid=CO:es-419',
    name: 'Google News - Estrellas Colombia',
    category: 'TRANSFER',
  },
];

const KEYWORDS_FILTER = [
  'mundial', 'world cup', '2026', 'colombia', 'seleccion', 'eliminatoria',
  'luis diaz', 'james', 'messi', 'cristiano', 'mbappé', 'mbappe',
  'futbol', 'fútbol', 'gol', 'fifa', 'conmebol',
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

  async scrapeNews(): Promise<{ created: number; skipped: number }> {
    this.logger.log('Starting news scraping...');
    let created = 0;
    let skipped = 0;

    // Get admin user for authorId
    const admin = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    if (!admin) {
      this.logger.warn('No admin user found, skipping scraping');
      return { created: 0, skipped: 0 };
    }

    for (const source of FEED_SOURCES) {
      try {
        const feed = await this.parser.parseURL(source.url);
        const items = (feed.items || []).slice(0, 10); // Max 10 per source

        for (const item of items) {
          const title = this.cleanTitle(item.title || '');
          if (!title) continue;

          // Check relevance
          const isRelevant = KEYWORDS_FILTER.some((kw) =>
            title.toLowerCase().includes(kw) ||
            (item.contentSnippet || '').toLowerCase().includes(kw)
          );
          if (!isRelevant) {
            skipped++;
            continue;
          }

          // Check if already exists (by title similarity)
          const exists = await this.prisma.news.findFirst({
            where: {
              title: { contains: title.substring(0, 50), mode: 'insensitive' },
              createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
            },
          });

          if (exists) {
            skipped++;
            continue;
          }

          // Build content
          const summary = this.cleanContent(item.contentSnippet || item.content || '');
          const content = this.buildContent(item, source.name);
          const imageUrl = this.extractImage(item);

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

          created++;

          // Limit to 5 news per scraping run
          if (created >= 5) break;
        }

        if (created >= 5) break;
      } catch (err) {
        this.logger.warn(`Failed to scrape ${source.name}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Scraping complete: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  }

  private cleanTitle(title: string): string {
    // Remove source attribution from Google News titles (e.g. "Title - Source Name")
    return title.replace(/\s*-\s*[^-]+$/, '').trim();
  }

  private cleanContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '') // Strip HTML
      .replace(/&[^;]+;/g, ' ') // Strip HTML entities
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildContent(item: RssParser.Item, sourceName: string): string {
    const snippet = this.cleanContent(item.contentSnippet || item.content || '');
    const link = item.link || '';
    const date = item.pubDate
      ? new Date(item.pubDate).toLocaleDateString('es-CO', { dateStyle: 'long' })
      : '';

    return [
      snippet,
      '',
      `Fuente: ${sourceName}`,
      date ? `Fecha: ${date}` : '',
      link ? `Leer mas: ${link}` : '',
    ].filter(Boolean).join('\n');
  }

  private extractImage(item: RssParser.Item): string | null {
    // Try to extract image from content/enclosure
    const content = item.content || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];

    // Check enclosure
    const enclosure = (item as any).enclosure;
    if (enclosure?.url && enclosure.type?.startsWith('image')) {
      return enclosure.url;
    }

    // Default World Cup themed images
    const defaultImages = [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80',
    ];
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  }
}
