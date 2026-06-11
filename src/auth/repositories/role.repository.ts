import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../schema/role.schema';
import { RoleType } from '../../users/schema/users.schema';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  async findById(id: RoleType): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  async upsert(
    id: RoleType,
    permissions: string[],
    description: string,
  ): Promise<Role> {
    await this.roleRepo.upsert({ id, permissions, description }, ['id']);
    return this.findById(id);
  }
}
