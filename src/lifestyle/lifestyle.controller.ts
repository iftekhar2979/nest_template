import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { LifestyleService } from './lifestyle.service';
import { LifeStyleDto } from './dto/lifestyle.dto';
// import { LifeStyle } from './dto/lifestyle.dto';  // LifeStyle schema

@Controller('lifestyles')
export class LifeStyleController {
  constructor(private readonly lifeStyleService: LifestyleService) {}
  // CREATE: Create a new lifestyle entry
  @Post()
  async createLifeStyle(@Body() lifeStyleDto: LifeStyleDto): Promise<any> {
    return this.lifeStyleService.createLifeStyle(lifeStyleDto);
  }

  // READ: Get lifestyle by userID
  @Get(':userID')
  async getLifeStyleByUserID(@Param('userID') userID: string): Promise<any> {
    return this.lifeStyleService.getLifeStyleByUserID(userID);
  }

  // UPDATE: Update lifestyle by ID
  @Put(':id')
  async updateLifeStyle(
    @Param('id') id: string,
    @Body() lifeStyleDto: LifeStyleDto,
  ): Promise<any> {
    return this.lifeStyleService.updateLifeStyle(id, lifeStyleDto);
  }

  // DELETE: Delete lifestyle by ID
  @Delete(':id')
  async deleteLifeStyle(@Param('id') id: string): Promise<any> {
    return this.lifeStyleService.deleteLifeStyle(id);
  }
}
