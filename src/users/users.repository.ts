import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { RoleType, User, UserStatus } from './schema/users.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .andWhere('user.isActive = true')
      .getOne();
  }

  async findByEmailIncludingInactive(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .withDeleted()
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id, isActive: true } });
  }

  async findByIdIncludingInactive(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, withDeleted: true });
  }

  async updateById(id: string, data: Partial<User>): Promise<User | null> {
    const update: Partial<User> = { ...data };
    if (update.passwordHash) {
      update.passwordHash = await argon2.hash(update.passwordHash);
    }
    await this.userRepo.update({ id }, update);
    return this.findByIdIncludingInactive(id);
  }

  async updateLastLoginAt(id: string): Promise<void> {
    await this.userRepo.update({ id }, { lastLoginAt: new Date() });
  }

  async findRoleUser(role: RoleType): Promise<User | null> {
    return this.userRepo.findOne({
      where: { role, status: UserStatus.ACTIVE, isActive: true },
    });
  }
}
