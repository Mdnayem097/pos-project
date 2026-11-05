import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true }); // Next.js frontend
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT ?? 3001;
  const swaggerConfig = new DocumentBuilder()
  .setTitle('Retail POS API')
  .setDescription('Products, categories, customers and sales')
  .setVersion('1.0')
  .build();
const document = SwaggerModule.createDocument(app, swaggerConfig);
SwaggerModule.setup('docs', app, document);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}
bootstrap();
