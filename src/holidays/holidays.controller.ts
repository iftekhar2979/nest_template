import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RoleType } from 'src/users/schema/users.schema';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';

@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  create(@Body() dto: CreateHolidayDto, @Request() req: any) {
    return this.holidaysService.create(dto, req.user?.id);
  }

  // Any authenticated user can view the holiday calendar
  @Get()
  @Roles(...Object.values(RoleType))
  findAll(@Query('region') region?: string) {
    return this.holidaysService.findAll(region);
  }

  @Get(':id')
  @Roles(...Object.values(RoleType))
  findOne(@Param('id') id: string) {
    return this.holidaysService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHolidayDto,
    @Request() req: any,
  ) {
    return this.holidaysService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
