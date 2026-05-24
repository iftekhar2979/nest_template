import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Otp } from '../otp.schema';

@Injectable()
export class OtpRepository {
  constructor(@InjectModel(Otp.name) private readonly otpModel: Model<Otp>) { }

  async create(data: any): Promise<Otp> {
    const newOtp = new this.otpModel(data);
    return await newOtp.save();
  }

  async upsertForUser(data: {
    userID: Types.ObjectId;
    oneTimePassword: string;
    expiredAt: Date;
  }): Promise<Otp> {
    return this.otpModel
      .findOneAndUpdate(
        { userID: data.userID },
        {
          $set: {
            oneTimePassword: data.oneTimePassword,
            expiredAt: data.expiredAt,
            attempts: 0,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async findByUserId(userId: Types.ObjectId): Promise<Otp | null> {
    return await this.otpModel.findOne({ userID: userId }).select('+oneTimePassword').exec();
  }

  async findByUserIdAndCode(userId: Types.ObjectId, code: string): Promise<Otp | null> {
    return await this.otpModel
      .findOne({ userID: userId, oneTimePassword: code })
      .select('+oneTimePassword')
      .exec();
  }

  async deleteByUserId(userId: Types.ObjectId): Promise<any> {
    return await this.otpModel.deleteMany({ userID: userId }).exec();
  }

  async incrementAttempts(otpId: Types.ObjectId): Promise<any> {
    return await this.otpModel.findByIdAndUpdate(otpId, { $inc: { attempts: 1 } }).exec();
  }
}
