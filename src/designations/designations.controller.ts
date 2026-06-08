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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RoleType } from 'src/users/schema/users.schema';
import { DesignationsService } from './designations.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
  DesignationResponseDto,
  DesignationDeleteResponseDto,
  QueryDesignationDto,
} from './dto/designation.dto';

@ApiTags('Designations')
@ApiBearerAuth()
@Controller('designations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new designation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The designation has been successfully created.',
    type: DesignationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions.' })
  create(@Body() dto: CreateDesignationDto, @Request() req: any) {
    return this.designationsService.create(dto, req.user?.id);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({
    summary:
      'List designations with pagination and filtering (search, departmentId)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Paginated list of designations: { data: DesignationResponseDto[], pagination }.',
    type: [DesignationResponseDto],
  })
  findAll(@Query() query: QueryDesignationDto) {
    return this.designationsService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get a designation by ID' })
  @ApiParam({ name: 'id', description: 'Designation UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The designation has been successfully retrieved.',
    type: DesignationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Designation not found.' })
  findOne(@Param('id') id: string) {
    return this.designationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update a designation' })
  @ApiParam({ name: 'id', description: 'Designation UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The designation has been successfully updated.',
    type: DesignationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Designation not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDesignationDto,
    @Request() req: any,
  ) {
    return this.designationsService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a designation' })
  @ApiParam({ name: 'id', description: 'Designation UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The designation has been successfully deleted.',
    type: DesignationDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Designation not found.' })
  remove(@Param('id') id: string) {
    return this.designationsService.remove(id);
  }
}
