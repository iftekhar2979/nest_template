import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken } from '../schema/refresh-token.schema';
import { Types } from 'mongoose';

@Injectable()
export class RefreshTokenRepository {
  constructor(@InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshToken>) { }

  async create(data: any): Promise<RefreshToken> {
    const newToken = new this.refreshTokenModel(data);
    return await newToken.save();
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.refreshTokenModel.findOne({ token }).exec();
  }

  async findActiveByUserId(userId: Types.ObjectId): Promise<RefreshToken[]> {
    return await this.refreshTokenModel.find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } }).exec();
  }

  async revokeByToken(token: string): Promise<any> {
    return await this.refreshTokenModel.findOneAndUpdate({ token }, { isRevoked: true }).exec();
  }

  async revokeAllByUserId(userId: Types.ObjectId): Promise<any> {
    return await this.refreshTokenModel.updateMany({ userId, isRevoked: false }, { isRevoked: true }).exec();
  }
}
