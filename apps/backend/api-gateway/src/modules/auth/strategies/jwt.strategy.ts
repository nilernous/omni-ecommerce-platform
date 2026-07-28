import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret') || 'omnicommerce_super_secret_jwt_key_2026',
    });
  }

  async validate(payload: any) {
    if (!payload || (!payload.sub && !payload.userId)) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub || payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
    };
  }
}
