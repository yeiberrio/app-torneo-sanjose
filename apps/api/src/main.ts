import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SportManager Pro API')
    .setDescription('API para gestion integral de torneos deportivos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`API running on port ${port}`);

  // Auto-scrape news on startup and every 12 hours
  try {
    const { NewsScraperService } = await import('./news/news-scraper.service');
    const scraper = app.get(NewsScraperService);
    scraper.scrapeNews().catch(() => {});
    setInterval(() => scraper.scrapeNews().catch(() => {}), 12 * 60 * 60 * 1000);
    console.log('News scraper scheduled (every 12h)');
  } catch (e) {
    console.warn('News scraper init skipped:', (e as Error).message);
  }
}
bootstrap();
