import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../schema/role.schema';
import { RoleType } from '../../users/schema/users.schema';

@Injectable()
export class RoleRepository {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<Role>) {}

  async findById(id: RoleType): Promise<Role | null> {
    return this.roleModel.findOne({ id }).exec();
  }

  async upsert(id: RoleType, permissions: string[], description: string): Promise<Role> {
    return this.roleModel
      .findOneAndUpdate(
        { id },
        { $set: { permissions, description } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
