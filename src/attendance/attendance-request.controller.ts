import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
  ApiProperty,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RoleType } from 'src/users/schema/users.schema';
import { AttendanceRequestService } from './attendance-request.service';
import {
  CreateAttendanceRequestDto,
  ReviewRequestDto,
} from './dto/attendance.dto';
import { AttendanceRequest, RequestStatus } from './schema/attendance-request.schema';

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

class AttendanceRequestPaginationResponse {
  @ApiProperty({ type: [AttendanceRequest] })
  data: AttendanceRequest[];

  @ApiProperty({ type: PaginationMetadata })
  pagination: PaginationMetadata;
}

@ApiTags('Attendance Requests')
@ApiBearerAuth()
@ApiExtraModels(AttendanceRequest, AttendanceRequestPaginationResponse)
@Controller('attendance/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceRequestController {
  constructor(
    private readonly attendanceRequestService: AttendanceRequestService,
  ) {}

  // --- Employee ---

  @Post()
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Create a new attendance regularization request' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Request created.', type: AttendanceRequest })
  create(@Request() req: any, @Body() dto: CreateAttendanceRequestDto) {
    return this.attendanceRequestService.create(req.user.id, dto);
  }

  @Get('me')
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'List my attendance requests' })
  @ApiQuery({ name: 'status', enum: RequestStatus, required: false, description: 'Filter by status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of my requests.', type: [AttendanceRequest] })
  listMine(@Request() req: any, @Query('status') status?: RequestStatus) {
    return this.attendanceRequestService.listMine(req.user.id, status);
  }

  @Patch(':id/cancel')
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Cancel my pending attendance request' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request cancelled.', type: AttendanceRequest })
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.attendanceRequestService.cancel(req.user.id, id);
  }

  // --- Admin approval queue ---

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'List all attendance requests (admin)' })
  @ApiQuery({ name: 'status', enum: RequestStatus, required: false, description: 'Filter by status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all requests.',
    type: [AttendanceRequest],
  })
  listAll(@Query('status') status?: RequestStatus) {
    return this.attendanceRequestService.listAll(status);
  }

  @Patch(':id/review')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Approve or reject an attendance request' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request reviewed.', type: AttendanceRequest })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewRequestDto,
    @Request() req: any,
  ) {
    return this.attendanceRequestService.review(id, dto, req.user.id);
  }
}
