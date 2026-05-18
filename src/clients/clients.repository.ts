import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client } from './schema/clients.schema';

@Injectable()
export class ClientRepository {
  constructor(@InjectModel(Client.name) private readonly clientModel: Model<Client>) {}

  async createForUser(data: {
    userId: Types.ObjectId;
    companyName?: string;
    phone?: string;
  }): Promise<Client> {
    return this.clientModel
      .findOneAndUpdate(
        { userId: data.userId },
        {
          $setOnInsert: {
            userId: data.userId,
            companyName: data.companyName ?? '',
            phone: data.phone ?? '',
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
