import { LifestyleService } from './../lifestyle/lifestyle.service';
import { interestAndValues } from './dto/lifeStyleAndValues.dto';
import { LifeStyleDto } from './../lifestyle/dto/lifestyle.dto';
// import { LifeStyle } from './utils-schema/lifeStyle.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ProfileDto } from './dto/profile.dto'; // Import the DTO
import { IProfile } from './interface/profile.interface'; // Import the Profile interface

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel('Profile') private readonly profileModel: Model<IProfile>,
    private readonly lifeStyleService: LifestyleService,
  ) {}
  async updateLifeStyle(user, LifeStyleDto, interestAndValues) {
    // console.log(userID);
    let userID = user.id;
    let profileID = user.profileID;

    let lifeStyle = Object.values(LifeStyleDto);

    await this.profileModel.findByIdAndUpdate(profileID, {
      lifeStyle: lifeStyle,
      interest: interestAndValues.interest,
      values: interestAndValues.values,
    });
    LifeStyleDto.userID = userID;
    // await this.li.create(LifeStyleDto);
    await this.lifeStyleService.createLifeStyle(LifeStyleDto);

    return { message: 'life style successfully updated!', data: {} };
  }
  // CREATE: Create a new profile
  async createProfile(profileDto: ProfileDto): Promise<IProfile> {
    const createdProfile = new this.profileModel(profileDto);
    return createdProfile.save();
  }

  // READ: Find all profiles
  async findAllProfiles(): Promise<IProfile[]> {
    return this.profileModel.find().exec();
  }

  // READ: Find a profile by ID
  async findProfileById(profileId: string): Promise<IProfile | null> {
    return this.profileModel.findById(profileId).exec();
  }

  // UPDATE: Update a profile by ID
  async updateProfile(
    profileId: string,
    profileDto: ProfileDto,
  ): Promise<IProfile | null> {
    return this.profileModel
      .findByIdAndUpdate(profileId, profileDto, {
        new: true, // Return the updated document
      })
      .exec();
  }

  // DELETE: Delete a profile by ID
  async deleteProfile(profileId: string): Promise<IProfile | null> {
    return this.profileModel.findByIdAndDelete(profileId).exec();
  }
}
