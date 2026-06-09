import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
  ApiProperty,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RoleType } from 'src/users/schema/users.schema';
import { DeviceApiKeyGuard } from 'src/shared/guards/device-api-key.guard';
import { AttendanceService } from './attendance.service';
import {
  AttendanceQueryDto,
  BatchPunchDto,
  BulkCorrectionDto,
  CheckInOutDto,
  ManualCorrectionDto,
  PunchDto,
} from './dto/attendance.dto';
import { AttendanceRecord } from './schema/attendance.schema';
import { AttendancePunch } from './schema/attendance-punch.schema';

class PaginationMetadata {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: 2, nullable: true })
  nextPage: number | null;

  @ApiProperty({ example: null, nullable: true })
  previousPage: number | null;

  @ApiProperty({ example: 20 })
  itemsPerPage: number;
}

class AttendanceRecordPaginationResponse {
  @ApiProperty({ type: [AttendanceRecord] })
  data: AttendanceRecord[];

  @ApiProperty({ type: PaginationMetadata })
  pagination: PaginationMetadata;
}

class MessageResponse {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}

@ApiTags('Attendance')
@ApiExtraModels(AttendanceRecord, AttendancePunch, AttendanceRecordPaginationResponse, MessageResponse)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- Device-agnostic punch ingestion ---

  @Post('punch')
  @UseGuards(DeviceApiKeyGuard)
  @ApiHeader({ name: 'x-device-key', description: 'API Key for the device gateway' })
  @ApiOperation({ summary: 'Ingest a single punch from a device gateway' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Punch recorded.', type: AttendancePunch })
  punch(@Body() dto: PunchDto) {
    return this.attendanceService.recordPunch(dto);
  }

  @Post('punch/batch')
  @UseGuards(DeviceApiKeyGuard)
  @ApiHeader({ name: 'x-device-key', description: 'API Key for the device gateway' })
  @ApiOperation({ summary: 'Ingest multiple punches in a single batch' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Batch recorded.', type: [AttendancePunch] })
  punchBatch(@Body() dto: BatchPunchDto) {
    return this.attendanceService.recordBatchPunches(dto.punches);
  }

  // --- Employee self-service ---

  @Post('check-in')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Employee self check-in via Web/Mobile' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Check-in recorded.', type: AttendancePunch })
  checkIn(@Request() req: any, @Body() dto: CheckInOutDto) {
    return this.attendanceService.checkIn(req.user.id, dto);
  }

  @Post('check-out')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Employee self check-out via Web/Mobile' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Check-out recorded.', type: AttendancePunch })
  checkOut(@Request() req: any, @Body() dto: CheckInOutDto) {
    return this.attendanceService.checkOut(req.user.id, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Get my attendance history' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance records list.', type: [AttendanceRecord] })
  myAttendance(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getMyAttendance(req.user.id, from, to);
  }

  @Get('me/today')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Get my attendance record for today' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Today\'s record.', type: AttendanceRecord })
  myToday(@Request() req: any) {
    return this.attendanceService.getToday(req.user.id);
  }

  // --- Admin oversight ---

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'List all attendance records (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of attendance records.',
    schema: { $ref: getSchemaPath(AttendanceRecordPaginationResponse) },
  })
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Post('correction')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Manually correct an attendance record' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Correction applied.', type: AttendanceRecord })
  correction(@Body() dto: ManualCorrectionDto, @Request() req: any) {
    return this.attendanceService.manualCorrection(dto, req.user.id);
  }

  @Post('correction/bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Apply manual corrections in bulk' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bulk corrections applied.', type: [AttendanceRecord] })
  bulkCorrection(@Body() dto: BulkCorrectionDto, @Request() req: any) {
    return this.attendanceService.bulkCorrection(dto, req.user.id);
  }

  @Get('export')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Export attendance data to CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'CSV file stream.' })
  async export(@Query() query: AttendanceQueryDto, @Res() res: Response) {
    const csv = await this.attendanceService.exportCsv(query);
    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      'attachment; filename="attendance-export.csv"',
    );
    res.send(csv);
  }
}
