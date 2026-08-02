import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

@Injectable()
export class UserService {
  private preferences = new Map<string, any>();

  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        addresses: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(id: string, data: any): Promise<any> {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        addresses: true,
      },
    });
  }

  async addAddress(userId: string, data: any): Promise<any> {
    await this.findById(userId);
    if (data.isDefault) {
      await this.clearDefaultAddress(userId);
    }

    return this.prisma.address.create({
      data: {
        userId,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: Boolean(data.isDefault),
      },
    });
  }

  async updateAddress(userId: string, addressId: string, data: any): Promise<any> {
    await this.assertAddressOwner(userId, addressId);
    if (data.isDefault) {
      await this.clearDefaultAddress(userId);
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<any> {
    await this.assertAddressOwner(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
    return { deleted: true, addressId };
  }

  async updatePreferences(userId: string, data: any): Promise<any> {
    await this.findById(userId);
    const current = this.preferences.get(userId) || {};
    const updated = { ...current, ...data, userId, updatedAt: new Date().toISOString() };
    this.preferences.set(userId, updated);
    return updated;
  }

  async assignRole(userId: string, role: any): Promise<any> {
    await this.findById(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  private async assertAddressOwner(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    if (address.userId !== userId) {
      throw new BadRequestException('Address does not belong to user');
    }
  }

  private async clearDefaultAddress(userId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
