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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RoleType } from 'src/users/schema/users.schema';
import { EmployeesService } from './employees.service';
import {
  BiometricEnrollDto,
  EnrollEmployeeDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // --- Employee self-service ---

  @Get('me')
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  me(@Request() req: any) {
    return this.employeesService.findByUserId(req.user.id);
  }

  // --- Admin / superadmin management ---

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  enroll(@Body() dto: EnrollEmployeeDto, @Request() req: any) {
    return this.employeesService.enroll(dto, req.user?.id);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: any,
  ) {
    return this.employeesService.update(id, dto, req.user?.id);
  }

  @Post(':id/biometric')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  enrollBiometric(
    @Param('id') id: string,
    @Body() dto: BiometricEnrollDto,
    @Request() req: any,
  ) {
    return this.employeesService.enrollBiometric(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
