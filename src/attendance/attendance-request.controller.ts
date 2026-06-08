import {
  Body,
  Controller,
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
import { AttendanceRequestService } from './attendance-request.service';
import {
  CreateAttendanceRequestDto,
  ReviewRequestDto,
} from './dto/attendance.dto';
import { RequestStatus } from './schema/attendance-request.schema';

@Controller('attendance/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceRequestController {
  constructor(
    private readonly attendanceRequestService: AttendanceRequestService,
  ) {}

  // --- Employee ---

  @Post()
  @Roles(...Object.values(RoleType))
  create(@Request() req: any, @Body() dto: CreateAttendanceRequestDto) {
    return this.attendanceRequestService.create(req.user.id, dto);
  }

  @Get('me')
  @Roles(...Object.values(RoleType))
  listMine(@Request() req: any, @Query('status') status?: RequestStatus) {
    return this.attendanceRequestService.listMine(req.user.id, status);
  }

  @Patch(':id/cancel')
  @Roles(...Object.values(RoleType))
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.attendanceRequestService.cancel(req.user.id, id);
  }

  // --- Admin approval queue ---

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  listAll(@Query('status') status?: RequestStatus) {
    return this.attendanceRequestService.listAll(status);
  }

  @Patch(':id/review')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  review(
    @Param('id') id: string,
    @Body() dto: ReviewRequestDto,
    @Request() req: any,
  ) {
    return this.attendanceRequestService.review(id, dto, req.user.id);
  }
}
