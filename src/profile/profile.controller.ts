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
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileDto } from './dto/profile.dto';
import { IProfile } from './interface/profile.interface';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { LifeStyleDto, interestAndValues } from './dto/lifeStyleAndValues.dto';
import { LifestyleService } from 'src/lifestyle/lifestyle.service';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import {
  omitProperties,
  pickProperties,
} from 'src/common/utils/omitProperties';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // CREATE: Create a new profile
  @Post()
  async createProfile(@Body() profileDto: ProfileDto): Promise<IProfile> {
    return this.profileService.createProfile(profileDto);
  }
  // READ: Find all profiles
  @Get()
  async findAllProfiles(): Promise<IProfile[]> {
    return this.profileService.findAllProfiles();
  }
  @Put('lifestyle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async updateUserLifestyle(
    @Request() req,
    @Body() LifeStyleDto: LifeStyleDto,
  ): Promise<any> {
    let user = req.user;
    let lifestyle = omitProperties(LifeStyleDto, ['interest', 'values']);
    let interestAndValues = pickProperties(LifeStyleDto, [
      'values',
      'interest',
    ]);

    return this.profileService.updateLifeStyle(
      user,
      lifestyle,
      interestAndValues,
    );
  }

  // READ: Find a profile by ID
  @Get(':id')
  async findProfileById(@Param('id') id: string): Promise<IProfile | null> {
    return this.profileService.findProfileById(id);
  }

  // UPDATE: Update a profile by ID
  @Put(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() profileDto: ProfileDto,
  ): Promise<IProfile | null> {
    return this.profileService.updateProfile(id, profileDto);
  }

  // DELETE: Delete a profile by ID
  @Delete(':id')
  async deleteProfile(@Param('id') id: string): Promise<IProfile | null> {
    return this.profileService.deleteProfile(id);
  }
}
