import {
  Body,
  Controller,
  Delete,
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
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RoleType } from 'src/users/schema/users.schema';
import {
  AssignWorkWeekPatternDto,
  CreateDayOverrideDto,
  CreateWeekdaySwapDto,
  CreateWorkWeekPatternDto,
  QueryWorkWeekPatternDto,
  UpdateWorkWeekPatternDto,
} from './dto/work-week.dto';
import { WorkweeksService } from './workweeks.service';
import { WorkWeekPattern } from './schema/work-week-pattern.schema';
import { EmployeeWorkWeekAssignment } from './schema/employee-work-week-assignment.schema';
import { EmployeeDayOverride } from './schema/employee-day-override.schema';

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

// Response models for Swagger
class WorkWeekPatternPaginationResponse {
  @ApiProperty({ type: [WorkWeekPattern] })
  data: WorkWeekPattern[];

  @ApiProperty({ type: PaginationMetadata })
  pagination: PaginationMetadata;
}

class WeekdaySwapResponse {
  @ApiProperty({ example: 's1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6' })
  swapId: string;

  @ApiProperty({ type: [EmployeeDayOverride] })
  overrides: EmployeeDayOverride[];
}

class MessageResponse {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}

@ApiTags('Work Weeks')
@ApiBearerAuth()
@ApiExtraModels(WorkWeekPattern, EmployeeWorkWeekAssignment, EmployeeDayOverride, WorkWeekPatternPaginationResponse, WeekdaySwapResponse, MessageResponse)
@Controller('work-weeks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
export class WorkweeksController {
  constructor(private readonly workweeksService: WorkweeksService) {}

  @Post('patterns')
  @ApiOperation({ summary: 'Create a new work week pattern' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The pattern has been successfully created.',
    type: WorkWeekPattern,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  createPattern(@Body() dto: CreateWorkWeekPatternDto, @Request() req: any) {
    return this.workweeksService.createPattern(dto, req.user?.id);
  }

  @Get('patterns')
  @ApiOperation({ summary: 'Retrieve all work week patterns with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of work week patterns with pagination metadata.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(WorkWeekPatternPaginationResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(WorkWeekPattern) },
            },
          },
        },
      ],
    },
  })
  findPatterns(@Query() query: QueryWorkWeekPatternDto) {
    return this.workweeksService.findPatterns(query);
  }

  @Get('patterns/:id')
  @ApiOperation({ summary: 'Get a specific work week pattern by ID' })
  @ApiParam({ name: 'id', description: 'The UUID of the pattern' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The found pattern.',
    type: WorkWeekPattern,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found.' })
  findPattern(@Param('id') id: string) {
    return this.workweeksService.findPattern(id);
  }

  @Patch('patterns/:id')
  @ApiOperation({ summary: 'Update an existing work week pattern' })
  @ApiParam({ name: 'id', description: 'The UUID of the pattern to update' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The pattern has been successfully updated.',
    type: WorkWeekPattern,
  })
  updatePattern(
    @Param('id') id: string,
    @Body() dto: UpdateWorkWeekPatternDto,
    @Request() req: any,
  ) {
    return this.workweeksService.updatePattern(id, dto, req.user?.id);
  }

  @Delete('patterns/:id')
  @ApiOperation({ summary: 'Remove a work week pattern' })
  @ApiParam({ name: 'id', description: 'The UUID of the pattern to delete' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The pattern has been successfully removed.',
    type: MessageResponse,
  })
  removePattern(@Param('id') id: string) {
    return this.workweeksService.removePattern(id);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a work week pattern to a user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The pattern has been assigned to the user.',
    type: EmployeeWorkWeekAssignment,
  })
  assignPattern(@Body() dto: AssignWorkWeekPatternDto, @Request() req: any) {
    return this.workweeksService.assignPattern(dto, req.user?.id);
  }

  @Get('assignments/:userId')
  @ApiOperation({ summary: 'Get all work week assignments for a specific user' })
  @ApiParam({ name: 'userId', description: 'The UUID of the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of assignments for the user.',
    type: [EmployeeWorkWeekAssignment],
  })
  findAssignmentsForUser(@Param('userId') userId: string) {
    return this.workweeksService.findAssignmentsForUser(userId);
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: 'Remove a specific work week assignment' })
  @ApiParam({ name: 'id', description: 'The UUID of the assignment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The assignment has been successfully removed.',
    type: MessageResponse,
  })
  removeAssignment(@Param('id') id: string) {
    return this.workweeksService.removeAssignment(id);
  }

  @Post('overrides')
  @ApiOperation({ summary: 'Create a day override for an employee' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The override has been successfully created.',
    type: EmployeeDayOverride,
  })
  createOverride(@Body() dto: CreateDayOverrideDto, @Request() req: any) {
    return this.workweeksService.createOverride(dto, req.user?.id);
  }

  @Post('swaps')
  @ApiOperation({ summary: 'Create a weekday swap (working day <-> off day)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The swap has been successfully created.',
    schema: {
      $ref: getSchemaPath(WeekdaySwapResponse),
    },
  })
  createSwap(@Body() dto: CreateWeekdaySwapDto, @Request() req: any) {
    return this.workweeksService.createWeekdaySwap(dto, req.user?.id);
  }

  @Get('overrides/:userId')
  @ApiOperation({ summary: 'Get all day overrides for a specific user' })
  @ApiParam({ name: 'userId', description: 'The UUID of the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of overrides for the user.',
    type: [EmployeeDayOverride],
  })
  findOverridesForUser(@Param('userId') userId: string) {
    return this.workweeksService.findOverridesForUser(userId);
  }

  @Delete('overrides/:id')
  @ApiOperation({ summary: 'Remove a specific day override' })
  @ApiParam({ name: 'id', description: 'The UUID of the override' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The override has been successfully removed.',
    type: MessageResponse,
  })
  removeOverride(@Param('id') id: string) {
    return this.workweeksService.removeOverride(id);
  }
}
