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
import { DesignationsService } from './designations.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto';

@Controller('designations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  create(@Body() dto: CreateDesignationDto, @Request() req: any) {
    return this.designationsService.create(dto, req.user?.id);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  findAll(@Query('departmentId') departmentId?: string) {
    return this.designationsService.findAll(departmentId);
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.designationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDesignationDto,
    @Request() req: any,
  ) {
    return this.designationsService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.designationsService.remove(id);
  }
}
