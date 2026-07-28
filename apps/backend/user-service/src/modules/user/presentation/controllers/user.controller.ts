import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from '../../application/services/user.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@omnicommerce/auth';
import { UserRole } from '@omnicommerce/constants';
import { AuthenticatedUser } from '@omnicommerce/types';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.userService.findById(user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllUsers(): Promise<any[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getUserById(@Param('id') id: string): Promise<any> {
    return this.userService.findById(id);
  }
}
