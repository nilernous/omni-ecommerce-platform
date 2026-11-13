import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@omnicommerce/database';
import { LoginDto, RegisterDto } from '@omnicommerce/dto';
import { UserRole } from '@omnicommerce/constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private refreshTokens = new Map<string, string>();
  private passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();
  private failedAttempts = new Map<string, { count: number; lockedUntil?: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = (dto.role as UserRole) || UserRole.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        role: role as any,
      },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    this.assertNotLocked(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      this.recordFailedAttempt(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      this.recordFailedAttempt(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.failedAttempts.delete(dto.email);
    const tokens = this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken);
    const storedToken = this.refreshTokens.get(payload.sub);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const tokens = this.generateTokens(payload.sub, payload.email, payload.role);
    return tokens;
  }

  async logout(userId: string): Promise<any> {
    this.refreshTokens.delete(userId);
    return { revoked: true };
  }

  async forgotPassword(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { accepted: true };
    }

    const token = 'RST-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    this.passwordResetTokens.set(token, {
      email,
      expiresAt: Date.now() + 1000 * 60 * 30,
    });

    return { accepted: true, resetToken: token };
  }

  async resetPassword(token: string, password: string): Promise<any> {
    const reset = this.passwordResetTokens.get(token);
    if (!reset || reset.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { email: reset.email },
      data: { password: hashedPassword },
    });
    this.passwordResetTokens.delete(token);
    return { reset: true };
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    this.refreshTokens.set(userId, refreshToken);
    return { accessToken, refreshToken };
  }

  private assertNotLocked(email: string): void {
    const attempt = this.failedAttempts.get(email);
    if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }
  }

  private recordFailedAttempt(email: string): void {
    const current = this.failedAttempts.get(email) || { count: 0 };
    const nextCount = current.count + 1;
    this.failedAttempts.set(email, {
      count: nextCount,
      lockedUntil: nextCount >= 5 ? Date.now() + 1000 * 60 * 15 : undefined,
    });
  }
}
