import { INestApplication, ValidationPipe } from '@nestjs/common';

export function setupGlobalPipes(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
