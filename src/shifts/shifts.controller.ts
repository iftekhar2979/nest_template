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
import { ShiftsService } from './shifts.service';
import {
  AssignShiftDto,
  BulkAssignShiftDto,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftResponseDto,
  ShiftAssignmentResponseDto,
  BulkAssignResponseDto,
  ShiftDeleteResponseDto,
  ShiftAssignmentDeleteResponseDto,
} from './dto/shift.dto';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift definition' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The shift has been successfully created.',
    type: ShiftResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions.' })
  create(@Body() dto: CreateShiftDto, @Request() req: any) {
    return this.shiftsService.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift definitions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all shifts retrieved successfully.',
    type: [ShiftResponseDto],
  })
  findAll() {
    return this.shiftsService.findAll();
  }

  // --- Assignments (declared before :id to avoid route clash) ---

  @Post('assign')
  @ApiOperation({ summary: 'Assign a shift to a user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Shift assigned successfully.',
    type: ShiftAssignmentResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or Shift not found.' })
  assign(@Body() dto: AssignShiftDto, @Request() req: any) {
    return this.shiftsService.assign(dto, req.user?.id);
  }

  @Post('assign/bulk')
  @ApiOperation({ summary: 'Bulk assign a shift to multiple users' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Shifts assigned successfully.',
    type: BulkAssignResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'One or more users or the shift not found.' })
  bulkAssign(@Body() dto: BulkAssignShiftDto, @Request() req: any) {
    return this.shiftsService.bulkAssign(dto, req.user?.id);
  }

  @Get('assignments/:userId')
  @ApiOperation({ summary: 'Get all shift assignments for a specific user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User assignments retrieved successfully.',
    type: [ShiftAssignmentResponseDto],
  })
  findAssignmentsForUser(@Param('userId') userId: string) {
    return this.shiftsService.findAssignmentsForUser(userId);
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: 'Remove a shift assignment by ID' })
  @ApiParam({ name: 'id', description: 'Shift assignment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift assignment removed successfully.',
    type: ShiftAssignmentDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shift assignment not found.' })
  removeAssignment(@Param('id') id: string) {
    return this.shiftsService.removeAssignment(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shift definition by ID' })
  @ApiParam({ name: 'id', description: 'Shift definition UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The shift has been successfully retrieved.',
    type: ShiftResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shift not found.' })
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shift definition' })
  @ApiParam({ name: 'id', description: 'Shift definition UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The shift has been successfully updated.',
    type: ShiftResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shift not found.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @Request() req: any,
  ) {
    return this.shiftsService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shift definition' })
  @ApiParam({ name: 'id', description: 'Shift definition UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The shift has been successfully deleted.',
    type: ShiftDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shift not found.' })
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
