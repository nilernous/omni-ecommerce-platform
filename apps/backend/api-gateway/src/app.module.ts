import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';
import appConfig from './config/app/app.config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.authServiceTcpHost'),
            port: configService.get<number>('app.authServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'USER_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.userServiceTcpHost'),
            port: configService.get<number>('app.userServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PRODUCT_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.productServiceTcpHost'),
            port: configService.get<number>('app.productServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'INVENTORY_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.inventoryServiceTcpHost'),
            port: configService.get<number>('app.inventoryServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'CART_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.cartServiceTcpHost'),
            port: configService.get<number>('app.cartServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'ORDER_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.orderServiceTcpHost'),
            port: configService.get<number>('app.orderServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PAYMENT_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.paymentServiceTcpHost'),
            port: configService.get<number>('app.paymentServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'SHIPPING_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.shippingServiceTcpHost'),
            port: configService.get<number>('app.shippingServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PROMOTION_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.promotionServiceTcpHost'),
            port: configService.get<number>('app.promotionServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'REVIEW_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('app.reviewServiceTcpHost'),
            port: configService.get<number>('app.reviewServiceTcpPort'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AppController],
})
export class AppModule {}
