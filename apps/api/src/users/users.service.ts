import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Address } from './entities/address.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Address) private addressRepo: Repository<Address>,
  ) {}

  async findProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['addresses'],
      select: ['id', 'name', 'email', 'phone', 'role', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: Partial<User>) {
    await this.userRepo.update({ id: userId }, { name: data.name, phone: data.phone });
    return this.findProfile(userId);
  }

  async addAddress(userId: string, data: Partial<Address>) {
    if (data.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    const addr = this.addressRepo.create({ ...data, userId });
    return this.addressRepo.save(addr);
  }

  async updateAddress(userId: string, addressId: string, data: Partial<Address>) {
    if (data.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    await this.addressRepo.update({ id: addressId, userId }, data);
    return this.addressRepo.findOne({ where: { id: addressId } });
  }

  async removeAddress(userId: string, addressId: string) {
    await this.addressRepo.delete({ id: addressId, userId });
    return { message: 'Address removed' };
  }

  // Admin methods
  async findAllCustomers(page = 1, limit = 20) {
    const [items, total] = await this.userRepo.findAndCount({
      where: { role: UserRole.CUSTOMER },
      select: ['id', 'name', 'email', 'phone', 'createdAt', 'isActive'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findCustomerDetail(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['orders', 'addresses'],
      select: ['id', 'name', 'email', 'phone', 'createdAt', 'isActive'],
    });
    if (!user) throw new NotFoundException('Customer not found');
    return user;
  }
}
