import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleType, User, UserStatus } from './schema/users.schema';
import { Types } from 'mongoose';
@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }

  async create(data: any): Promise<User> {
    const newUser = new this.userModel(data);
    return await newUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async findByEmailIncludingInactive(email: string): Promise<User | null> {
    return await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .setOptions({ ignoreGlobalFilters: true })
      .exec();
  }

  async findById(id: Types.ObjectId | string): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  async findByIdIncludingInactive(id: Types.ObjectId | string): Promise<User | null> {
    return await this.userModel
      .findById(id)
      .setOptions({ ignoreGlobalFilters: true })
      .exec();
  }

  async updateById(id: Types.ObjectId | string, data: any): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateLastLoginAt(id: Types.ObjectId | string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
  }

  async findRoleUser(role: RoleType): Promise<User | null> {
    return this.userModel.findOne({ role, status: UserStatus.ACTIVE }).exec();
  }
}
