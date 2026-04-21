import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Otp } from '../otp.schema';

@Injectable()
export class OtpRepository {
  constructor(@InjectModel(Otp.name) private readonly otpModel: Model<Otp>) { }

  async create(data: any): Promise<Otp> {
    const newOtp = new this.otpModel(data);
    return await newOtp.save();
  }

  async findByUserId(userId: Types.ObjectId): Promise<Otp | null> {
    return await this.otpModel.findOne({ userID: userId }).exec();
  }

  async findByUserIdAndCode(userId: Types.ObjectId, code: string): Promise<Otp | null> {
    return await this.otpModel.findOne({ userID: userId, oneTimePassword: code }).exec();
  }

  async deleteByUserId(userId: Types.ObjectId): Promise<any> {
    return await this.otpModel.deleteMany({ userID: userId }).exec();
  }

  async incrementAttempts(otpId: Types.ObjectId): Promise<any> {
    return await this.otpModel.findByIdAndUpdate(otpId, { $inc: { attempts: 1 } }).exec();
  }
}
