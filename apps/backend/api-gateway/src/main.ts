import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const corsOrigin = configService.get<string>('cors.origin') || '*';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    methods: configService.get<string[]>('cors.methods') || [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: configService.get<string[]>('cors.allowedHeaders') || [
      'Content-Type',
      'Authorization',
      'x-correlation-id',
    ],
    credentials: configService.get<boolean>('cors.credentials') || false,
  });

  // Global Prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe
  const validationOptions = configService.get('validation');
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  // Swagger Documentation Setup
  const isSwaggerEnabled = configService.get<boolean>('swagger.enabled') !== false;
  if (isSwaggerEnabled) {
    const swaggerTitle = configService.get<string>('swagger.title') || 'OmniCommerce API Gateway';
    const swaggerDescription =
      configService.get<string>('swagger.description') ||
      'Centralized Edge API Gateway REST Endpoints';
    const swaggerVersion = configService.get<string>('swagger.version') || '1.0.0';
    const swaggerPath = configService.get<string>('swagger.path') || 'docs';

    const swaggerOptions = new DocumentBuilder()
      .setTitle(swaggerTitle)
      .setDescription(swaggerDescription)
      .setVersion(swaggerVersion)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT Access Token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerOptions);
    SwaggerModule.setup(swaggerPath, app, document);
  }

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway is running on port ${port}`);
  console.log(`📚 OpenAPI Docs available at http://localhost:${port}/docs`);
}

bootstrap();
