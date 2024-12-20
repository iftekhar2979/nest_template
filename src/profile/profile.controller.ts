import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
  Patch,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileDto } from './dto/profile.dto';
import { IProfile, userLifeStyle, InterestAndValuesAttributes } from './interface/profile.interface';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { LifeStyleDto, InterestAndValuesDto } from './dto/lifeStyleAndValues.dto';
import { LifestyleService } from 'src/lifestyle/lifestyle.service';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import {
  omitProperties,
  pickProperties,
} from 'src/common/utils/omitProperties';
import { EditProfileBasicInfoDto } from './dto/editProfile.dto';
import { AddLocationDto } from './dto/edit.location.dto';
import { Types } from 'mongoose';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // CREATE: Create a new profile
  // @Post()
  // async createProfile(@Body() profileDto: ProfileDto): Promise<IProfile> {
  //   return this.profileService.createProfile(profileDto);
  // }

  // READ: Find all profiles
  // @Get()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  // async findAllProfiles(): Promise<IProfile[]> {
  //   return this.profileService.findAllProfiles();
  // }
  @Put('lifestyle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async updateUserLifestyle(
    @Request() req,
    @Body() LifeStyleDto: LifeStyleDto,
  ): Promise<any> {
    let user = req.user;
    let lifestyle  = omitProperties(LifeStyleDto, ['interest', 'values']) as userLifeStyle;
    let interestAndValues :InterestAndValuesAttributes = pickProperties(LifeStyleDto, [
      'values',
      'interest',
    ]) as userLifeStyle ;
    return this.profileService.updateLifeStyle(
      user,
      lifestyle,
      interestAndValues,
    );
  }

  // READ: Find a profile by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async findProfileById(@Param('id') id: string): Promise<any> {
    return this.profileService.findProfileById(id);
  }

  // UPDATE: Update a profile by ID
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async updateProfile(
    @Request() req,
    @Body() editProfileBasicInfoDto:EditProfileBasicInfoDto,
  ): Promise<IProfile | null> {
    let id = req.user.profileID;
    if(!id){
      throw new NotFoundException("User Not Found!")
    }
    return this.profileService.updateProfile(id, editProfileBasicInfoDto);
  }

  @Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
async getSwipesProfile(@Request() req, @Query('limit') limit: string, @Query('page') page: string): Promise<any> {
  let user = req.user;  

  if (!user.id) {
    throw new NotFoundException("User Not Found!");
  }
  const userId = Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : null;
  if (!userId) {
    throw new BadRequestException("Invalid User ID format.");
  }
  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    throw new BadRequestException("Invalid 'limit' value. It must be a positive number.");
  }
  if (isNaN(parsedPage) || parsedPage <= 0) {
    throw new BadRequestException("Invalid 'page' value. It must be a positive number.");
  }

  // Call service method to fetch swipe profiles with pagination
  return this.profileService.swipeProfiles(user, parsedLimit, parsedPage);
}

  @Patch('location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async updateLocation(
    @Request() req,
    @Body() AddLocationDto:AddLocationDto,
  ): Promise<any> {
    // console.log("User dto",AddLocationDto)
    let user = req.user;
    if(!user.id){
      throw new NotFoundException("User Not Found!")
    }
    return this.profileService.updateLocation(user,AddLocationDto);
  }


  // DELETE: Delete a profile by ID
  @Delete(':id')
  async deleteProfile(@Param('id') id: string): Promise<IProfile | null> {
    return this.profileService.deleteProfile(id);
  }
}
