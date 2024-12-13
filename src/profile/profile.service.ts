import { LifestyleService } from './../lifestyle/lifestyle.service';
import { ObjectId } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProfileDto } from './dto/profile.dto'; // Import the DTO
import {
  InterestAndValuesAttributes,
  IProfile,
  Location,
  userLifeStyle,
} from './interface/profile.interface'; // Import the Profile interface
import { EditProfileBasicInfoDto } from './dto/editProfile.dto';
import { User } from 'src/auth/interface/jwt.info.interfact';
import { AddLocationDto } from './dto/edit.location.dto';
import {
  InterestAndValuesDto,
  LifeStyleDto,
} from './dto/lifeStyleAndValues.dto';
import { pagination } from 'src/common/pagination/pagination';
@Injectable()
export class ProfileService {
  constructor(
    @InjectModel('Profile') private readonly profileModel: Model<IProfile>,
    private readonly lifeStyleService: LifestyleService,
  ) {}
  async updateLifeStyle(
    user: User,
    LifeStyleDto: LifeStyleDto,
    interestAndValues: InterestAndValuesDto,
  ) {
    let userID = user.id;
    let profileID = user.profileID;
    let lifeStyle = Object.values(LifeStyleDto);
    await this.profileModel.findByIdAndUpdate(profileID, {
      lifeStyle: lifeStyle,
      interest: interestAndValues.interest,
      values: interestAndValues.values,
    });
    const lifeStyleInfo = {
      userID: userID,
      smoking: LifeStyleDto.smoking,
      drinking: LifeStyleDto.drinking,
      pets: LifeStyleDto.pets,
      execise: LifeStyleDto.execise,
      education: LifeStyleDto.education,
      communicationStyle: LifeStyleDto.communicationStyle,
      relationshipPreference: LifeStyleDto.relationshipPreference,
      socialMedia: LifeStyleDto.socialMedia,
    };
    await this.lifeStyleService.createLifeStyle(lifeStyleInfo);
    return { message: 'life style successfully updated!', data: {} };
  }
  // CREATE: Create a new profile
  // async createProfile(profileDto: ProfileDto): Promise<IProfile> {
  //   const createdProfile = new this.profileModel(profileDto);
  //   return createdProfile.save();
  // }

  // READ: Find all profiles
  async findAllProfiles(): Promise<IProfile[]> {
    return this.profileModel.find().exec();
  }

  // READ: Find a profile by ID
  async findProfileById(profileId: string): Promise<any> {
    let query = [
      {
        $match: {
          _id: new ObjectId(profileId),
        },
      },
      {
        $lookup: {
          from: 'galleries',
          localField: '_id',
          foreignField: 'profileID',
          as: 'gallery',
        },
      },

      {
        $lookup: {
          from: 'lifestyles',
          localField: 'userID',
          foreignField: 'userID',
          as: 'lifestyle',
        },
      },

      {
        $addFields: {
          lifestyle: {
            $arrayElemAt: ['$lifestyle', 0], // Flatten lifestyle array
          },
        },
       
      },
      {
        $addFields: {
          age: {
            $dateDiff: {
              startDate: '$dOB', // Assuming dOB (Date of Birth) field exists
              endDate: new Date(),
              unit: 'year',
            },
          },
          pictures: {
            $map: {
              input: '$gallery',
              as: 'item',
              in: '$$item.imageURL',
            },
          },
        },
      },
      {
        $project: {
          // Exclude fields directly here
          lifeStyle: 0,
          createdAt: 0,
          updatedAt: 0,
          isDeleted: 0,
          __v: 0,
          location: 0,
          gallery:0,
          userID:0,
          galleryID:0,
          isSubscibed:0,
          

        },
      },
    ];
    let profile = await this.profileModel.aggregate(query);
    return { message: 'User Retrived Successfully', data: profile[0] };
  }

  // UPDATE: Update a profile by ID
  async updateProfile(
    profileId: string,
    profileDto: EditProfileBasicInfoDto,
  ): Promise<IProfile | null> {
    return this.profileModel
      .findByIdAndUpdate(profileId, profileDto, {
        new: true, // Return the updated document
      })
      .exec();
  }

  async updateLocation(
    user: User,
    AddLocationDto: AddLocationDto,
  ): Promise<any> {
    // Define the location object with latitude and longitude
    let location = {
      type: 'Point',
      coordinates: [
        parseFloat(AddLocationDto.longitude),
        parseFloat(AddLocationDto.latitude),
      ],
    };

    // Fetch location details from OpenCage API
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${AddLocationDto.latitude},${AddLocationDto.longitude}&key=54411e052e544c04b65442b11b490ae6&language=en`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch location data: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // You can extract more specific location info here if needed
      const locationDetails = data.results[0];

      // Example: Extract formatted address and country
      const formattedAddress = locationDetails.formatted;
      const country = locationDetails.components.country;

      // Optionally, update the location object with detailed address info
      location = {
        type: 'Point',
        coordinates: [
          parseFloat(AddLocationDto.longitude),
          parseFloat(AddLocationDto.latitude),
        ],
      };
      // Update the user's profile with the new location
      await this.profileModel.findByIdAndUpdate(
        user.profileID,
        { location, country: country, address: formattedAddress },
        { new: true },
      );

      return {
        message: 'Location Updated Successfully',
        data: {
          address: formattedAddress,
          country: country,
        },
      };
    } catch (error) {
      // Handle any errors during the API call or profile update
      console.error('Error updating location:', error);
      return {
        message: 'Error updating location',
        error: error.message,
      };
    }
  }

  async swipeProfiles(user: User, limit: number, page: number): Promise<any> {
    // let userProfile = await this.profileModel.findById(user.profileID)
    let users = await this.profileModel.findById(user.profileID);

    // let documentCountQuery=[
    //   {
    //     $geoNear: {
    //       near: {
    //         type: 'Point',
    //         coordinates: [
    //           users.location.coordinates[0],
    //           users.location.coordinates[1],
    //         ],
    //       },
    //       distanceField: 'distance',
    //       maxDistance: 10000,
    //       spherical: true,
    //     },
    //   },
    //   {
    //     $match: {
    //       isDeleted: false,
    //       userID: { $ne: new ObjectId(user.id) },
    //       gender: { $ne: users.gender },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       matchedLifeStyles: {
    //         $setIntersection: ['$lifeStyle', users.lifeStyle],
    //       },
    //       matchedInterest: {
    //         $setIntersection: ['$interest', users.interest],
    //       },
    //       matchedValues: {
    //         $setIntersection: ['$values', users.values],
    //       },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       commonLifeStyles: { $size: '$matchedLifeStyles' },
    //       commonInterest: { $size: '$matchedInterest' },
    //       commonValues: { $size: '$matchedValues' },
    //     },
    //   },
    //   {
    //     $match: {
    //       commonLifeStyles: { $gte: 1 },
    //       commonInterest: { $gte: 1 },
    //       commonValues: { $gte: 1 },
    //     },
    //   },
    //   {
    //     $count: 'totalCount',
    //   },
    // ]
    let totalCount = await this.profileModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [
              users.location.coordinates[0],
              users.location.coordinates[1],
            ],
          },
          distanceField: 'distance',
          maxDistance: 10000,
          spherical: true,
        },
      },
      {
        $match: {
          isDeleted: false,
          userID: { $ne: new ObjectId(user.id) },
          gender: { $ne: users.gender },
        },
      },
      {
        $addFields: {
          matchedLifeStyles: {
            $setIntersection: ['$lifeStyle', users.lifeStyle],
          },
          matchedInterest: {
            $setIntersection: ['$interest', users.interest],
          },
          matchedValues: {
            $setIntersection: ['$values', users.values],
          },
        },
      },
      {
        $addFields: {
          commonLifeStyles: { $size: '$matchedLifeStyles' },
          commonInterest: { $size: '$matchedInterest' },
          commonValues: { $size: '$matchedValues' },
        },
      },
      {
        $match: {
          commonLifeStyles: { $gte: 1 },
          commonInterest: { $gte: 1 },
          commonValues: { $gte: 1 },
        },
      },
      {
        $count: 'totalCount',
      },
    ]);
    console.log(totalCount);
    let swipesUser = await this.profileModel.aggregate([
      // First stage: GeoNear (Filter documents by proximity)
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [
              users.location.coordinates[0], // User's longitude
              users.location.coordinates[1], // User's latitude
            ],
          },
          distanceField: 'distance', // Field to store distance
          maxDistance: 10000, // Max distance in meters (adjust as needed)
          spherical: true, // Use spherical geometry
        },
      },
      // Match Stage: Filter out deleted users and users of the same gender
      {
        $match: {
          isDeleted: false,
          userID: { $ne: new ObjectId(user.id) }, // Exclude current user
          gender: { $ne: users.gender }, // Exclude users of the same gender
        },
      },
      // Lookup for Galleries
      {
        $lookup: {
          from: 'galleries',
          localField: '_id',
          foreignField: 'profileID',
          as: 'gallery',
        },
      },
      // Lookup for Users
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'profileID',
          as: 'user',
        },
      },
      // Unwind the 'user' field
      {
        $unwind: {
          path: '$user',
        },
      },
      // Add fields to calculate age, matched life styles, interests, and values
      {
        $addFields: {
          age: {
            $dateDiff: {
              startDate: '$dOB', // User's date of birth
              endDate: new Date(), // Current date
              unit: 'year', // Calculate difference in years
            },
          },
          pictures: {
            $map: {
              input: '$gallery',
              as: 'item',
              in: '$$item.imageURL',
            },
          },
          matchedLifeStyles: {
            $setIntersection: ['$lifeStyle', users.lifeStyle], // Compare lifestyle
          },
          matchedInterest: {
            $setIntersection: ['$interest', users.interest], // Compare interests
          },
          matchedValues: {
            $setIntersection: ['$values', users.values], // Compare values
          },
        },
      },
      // Add field sizes for the matched attributes
      {
        $addFields: {
          commonLifeStyles: { $size: '$matchedLifeStyles' },
          commonInterest: { $size: '$matchedInterest' },
          commonValues: { $size: '$matchedValues' },
        },
      },
      // Match stage: Filter out users that have at least 1 common lifestyle, interest, and value
      {
        $match: {
          commonLifeStyles: { $gte: 1 },
          commonInterest: { $gte: 1 },
          commonValues: { $gte: 1 },
        },
      },
      // Pagination: Use $skip and $limit for pagination
      {
        $skip: (page - 1) * limit, // Skip the number of documents based on the current page
      },
      {
        $limit: limit, // Limit the number of documents per page
      },
      // Project stage: Select fields to return in the response
      {
        $project: {
          name: '$user.name',
          age: 1,
          address: 1,
          pictures: 1,
          gender: 1,
          matchedLifeStyles: 1,
          commonLifeStyles: 1,
          commonInterest: 1,
          matchedInterest: 1,
          commonValues: 1,
          matchedValues: 1,
          distance: { $round: [{ $divide: ['$distance', 1000] }, 2] }, // Include the distance field from $geoNear
        },
      },
    ]);
    let count = totalCount[0].totalCount;
    return {
      message: `${count} Users Found`,
      data: swipesUser,
      pagination: pagination(limit, page, count),
    };
  }

  // DELETE: Delete a profile by ID
  async deleteProfile(profileId: string): Promise<IProfile | null> {
    return this.profileModel.findByIdAndDelete(profileId).exec();
  }
}
