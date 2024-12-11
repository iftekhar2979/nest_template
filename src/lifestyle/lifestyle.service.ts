import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LifeStyle } from './lifestyle.schema';
import { LifeStyleDto } from './dto/lifestyle.dto';
import { Response } from 'src/common/interface/response.interface';

@Injectable()
export class LifestyleService {
  constructor(
    @InjectModel(LifeStyle.name)
    private readonly lifeStyleModel: Model<LifeStyle>,
  ) {}

  // CREATE: Create a new lifestyle entry
  async createLifeStyle(lifeStyleDto: LifeStyleDto): Promise<LifeStyle> {
    const newLifeStyle = new this.lifeStyleModel(lifeStyleDto);
    return newLifeStyle.save();
  }

  // READ: Get lifestyle by userID
  async getLifeStyleByUserID(userID: string): Promise<LifeStyle> {
    const lifestyle = await this.lifeStyleModel.findOne({ userID }).exec();
    if (!lifestyle) {
      throw new NotFoundException(`Users life style not found!`);
    }
    return lifestyle;
  }

  // UPDATE: Update lifestyle by ID
  async updateLifeStyle(
    id: string,
    lifeStyleDto: LifeStyleDto,
  ): Promise<Response<any>> {
    let lifestyle = await this.lifeStyleModel.findOne({ userID: id }).exec();
    if (!lifestyle) {
      throw new ConflictException('Users Life Style not found!');
    }
    // console.log(lifestyle)
   await this.lifeStyleModel
      .findOneAndUpdate({userID:id}, lifeStyleDto, { new: true })
      .exec();
    return {
      message: 'Life style updated successfully!',
      data: {},
      statusCode: 200,
    };
  }

  // DELETE: Delete lifestyle by ID
  async deleteLifeStyle(id: string): Promise<LifeStyle> {
    const deletedLifeStyle = await this.lifeStyleModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedLifeStyle) {
      throw new NotFoundException(`Lifestyle with ID ${id} not found`);
    }
    return deletedLifeStyle;
  }
}
