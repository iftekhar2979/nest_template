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
import { EmployeesService } from './employees.service';
import {
  BiometricEnrollDto,
  EnrollEmployeeDto,
  UpdateEmployeeDto,
  EmployeeResponseDto,
  EmployeeDeleteResponseDto,
} from './dto/employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // --- Employee self-service ---

  @Get('me')
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get current logged-in employee profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The employee profile has been successfully retrieved.',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee profile not found.' })
  me(@Request() req: any) {
    return this.employeesService.findByUserId(req.user.id);
  }

  // --- Admin / superadmin management ---

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Enroll a new employee (creates user login and employee record)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The employee has been successfully enrolled.',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email or employee code already exists.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions.' })
  enroll(@Body() dto: EnrollEmployeeDto, @Request() req: any) {
    return this.employeesService.enroll(dto, req.user?.id);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all employees retrieved successfully.',
    type: [EmployeeResponseDto],
  })
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The employee has been successfully retrieved.',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found.' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update an employee record' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The employee has been successfully updated.',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Employee code or device ID already exists.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: any,
  ) {
    return this.employeesService.update(id, dto, req.user?.id);
  }

  @Post(':id/biometric')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Enroll biometric data for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Biometric data enrolled successfully.',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found.' })
  enrollBiometric(
    @Param('id') id: string,
    @Body() dto: BiometricEnrollDto,
    @Request() req: any,
  ) {
    return this.employeesService.enrollBiometric(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Soft-delete an employee record' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The employee has been successfully deleted.',
    type: EmployeeDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found.' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
