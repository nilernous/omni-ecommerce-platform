import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  login(dto: LoginDto) {
    return lastValueFrom(this.authClient.send(PATTERNS.AUTH.LOGIN, dto));
  }

  register(dto: RegisterDto) {
    return lastValueFrom(this.authClient.send(PATTERNS.AUTH.REGISTER, dto));
  }

  refresh(dto: RefreshTokenDto) {
    return lastValueFrom(this.authClient.send(PATTERNS.AUTH.REFRESH, dto));
  }

  logout(userId: string) {
    return lastValueFrom(this.authClient.send(PATTERNS.AUTH.LOGOUT, { userId }));
  }
}
