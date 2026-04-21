import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/users.schema';
import { Types } from 'mongoose';
@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }

  async create(data: any): Promise<User> {
    const newUser = new this.userModel(data);
    return await newUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: Types.ObjectId): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  async updateById(id: Types.ObjectId, data: any): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}
