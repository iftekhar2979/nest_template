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
import { ShiftsService } from './shifts.service';
import {
  AssignShiftDto,
  BulkAssignShiftDto,
  CreateShiftDto,
  UpdateShiftDto,
} from './dto/shift.dto';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  create(@Body() dto: CreateShiftDto, @Request() req: any) {
    return this.shiftsService.create(dto, req.user?.id);
  }

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  // --- Assignments (declared before :id to avoid route clash) ---

  @Post('assign')
  assign(@Body() dto: AssignShiftDto, @Request() req: any) {
    return this.shiftsService.assign(dto, req.user?.id);
  }

  @Post('assign/bulk')
  bulkAssign(@Body() dto: BulkAssignShiftDto, @Request() req: any) {
    return this.shiftsService.bulkAssign(dto, req.user?.id);
  }

  @Get('assignments/:userId')
  findAssignmentsForUser(@Param('userId') userId: string) {
    return this.shiftsService.findAssignmentsForUser(userId);
  }

  @Delete('assignments/:id')
  removeAssignment(@Param('id') id: string) {
    return this.shiftsService.removeAssignment(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @Request() req: any,
  ) {
    return this.shiftsService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
