import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'identity-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
