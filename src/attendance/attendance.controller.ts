import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- Device-agnostic punch ingestion (gateway authenticates via API key) ---

  @Post('punch')
  @UseGuards(DeviceApiKeyGuard)
  punch(@Body() dto: PunchDto) {
    return this.attendanceService.recordPunch(dto);
  }

  @Post('punch/batch')
  @UseGuards(DeviceApiKeyGuard)
  punchBatch(@Body() dto: BatchPunchDto) {
    return this.attendanceService.recordBatchPunches(dto.punches);
  }

  // --- Employee self-service ---

  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  checkIn(@Request() req: any, @Body() dto: CheckInOutDto) {
    return this.attendanceService.checkIn(req.user.id, dto);
  }

  @Post('check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  checkOut(@Request() req: any, @Body() dto: CheckInOutDto) {
    return this.attendanceService.checkOut(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  myAttendance(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getMyAttendance(req.user.id, from, to);
  }

  @Get('me/today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...Object.values(RoleType))
  myToday(@Request() req: any) {
    return this.attendanceService.getToday(req.user.id);
  }

  // --- Admin oversight ---

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Post('correction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  correction(@Body() dto: ManualCorrectionDto, @Request() req: any) {
    return this.attendanceService.manualCorrection(dto, req.user.id);
  }

  @Post('correction/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  bulkCorrection(@Body() dto: BulkCorrectionDto, @Request() req: any) {
    return this.attendanceService.bulkCorrection(dto, req.user.id);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
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
