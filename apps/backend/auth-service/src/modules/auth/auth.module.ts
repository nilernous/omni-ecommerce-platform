import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@omnicommerce/database';
import { AuthRpcController } from './controllers/auth.rpc.controller';
import { AuthEventController } from './controllers/auth.event.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwtExpiresIn') || '1d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthRpcController, AuthEventController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
