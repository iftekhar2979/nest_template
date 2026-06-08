import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentResponseDto,
  DepartmentDeleteResponseDto,
} from './dto/department.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The department has been successfully created.',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Department name already exists.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions.' })
  create(@Body() dto: CreateDepartmentDto, @Request() req: any) {
    return this.departmentsService.create(dto, req.user?.id);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all departments retrieved successfully.',
    type: [DepartmentResponseDto],
  })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The department has been successfully retrieved.',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found.' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The department has been successfully updated.',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @Request() req: any,
  ) {
    return this.departmentsService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The department has been successfully deleted.',
    type: DepartmentDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found.' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
