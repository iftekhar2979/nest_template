import {
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import  { Model,  } from 'mongoose';
import { User } from './users.schema';
import { pagination } from 'src/common/pagination/pagination';
import { IPagination } from 'src/common/pagination/pagination.interface';
import { CreateUserDto } from './dto/createUser.dto';
@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }
  async createUser(user): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }
  async updateProfilePicture(id: string, url: string): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      id,
      { image: url },
      { new: true },
    );
  }
  async checkUserExistWiththeName(createUserDto: CreateUserDto): Promise<User> {
    return await this.userModel.findOne({ name: createUserDto.fullName });
  }
  async checkUserExistWiththeEmail(
    createUserDto: CreateUserDto,
  ): Promise<User> {
    return await this.userModel.findOne({ email: createUserDto.email });
  }
  async findAll(query: {
    term: string;
    page: string;
    limit: string;
  }): Promise<{ data: User[]; pagination: IPagination }> {
    let page = parseFloat(query.page);
    let limit = parseFloat(query.limit);
    const skip = (page - 1) * limit;
    const data = await this.userModel
      .find({
      $or: [
        { name: { $regex: new RegExp(query.term, 'i') } },
        { email: { $regex: new RegExp(query.term, 'i') } },
      ],
      isDeleted:false,
      role: 'user',
      })
      .select('-password')
      .sort({createdAt:-1})
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.userModel
      .countDocuments({
        $or: [
          { name: { $regex: new RegExp(query.term, 'i') } },
          { email: { $regex: new RegExp(query.term, 'i') } },
        ],
        isDeleted:false,
        role: 'user',
        })
      .exec();
    return { data, pagination: pagination(limit, page, total) };
  }

  // Find a user by ID
  findOne(id: string) {
    return this.userModel
      .findById(id, {
        pin: 0,
        pinAttempts: 0,
        isDeleted: 0,
        isEmailVerified: 0,
        profileID: 0,
      })
      .select('-password')
      .exec();
  }
  count() {
    return this.userModel
      .countDocuments()
      .exec();
  }

  // Update a user by ID
  async update(id: string, updateUserDto: any): Promise<User> {
    return await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select(
        '-password -pin -pinAttempts -isDeleted -isEmailVerified -profileID',
      )
      .exec();
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
  async delete(id: string): Promise<any> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
  async uploadProfilePicture(user: User, file): Promise<any> {
    await this.updateProfilePicture(
      user.id,
      `${file.location.split('/').slice(3, 5).join('/')}`,
    );
    return {
      message: 'Profile Picture Uploaded Successfully',
      data: { url: file.location.split('/').slice(3, 5).join('/') },
    };
  }
}
