import {
  Body,
  Controller,
  Delete,
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
import {
  AssignWorkWeekPatternDto,
  CreateDayOverrideDto,
  CreateWeekdaySwapDto,
  CreateWorkWeekPatternDto,
  QueryWorkWeekPatternDto,
  UpdateWorkWeekPatternDto,
} from './dto/work-week.dto';
import { WorkweeksService } from './workweeks.service';

@Controller('work-weeks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
export class WorkweeksController {
  constructor(private readonly workweeksService: WorkweeksService) {}

  @Post('patterns')
  createPattern(@Body() dto: CreateWorkWeekPatternDto, @Request() req: any) {
    return this.workweeksService.createPattern(dto, req.user?.id);
  }

  @Get('patterns')
  findPatterns(@Query() query: QueryWorkWeekPatternDto) {
    return this.workweeksService.findPatterns(query);
  }

  @Get('patterns/:id')
  findPattern(@Param('id') id: string) {
    return this.workweeksService.findPattern(id);
  }

  @Patch('patterns/:id')
  updatePattern(
    @Param('id') id: string,
    @Body() dto: UpdateWorkWeekPatternDto,
    @Request() req: any,
  ) {
    return this.workweeksService.updatePattern(id, dto, req.user?.id);
  }

  @Delete('patterns/:id')
  removePattern(@Param('id') id: string) {
    return this.workweeksService.removePattern(id);
  }

  @Post('assign')
  assignPattern(@Body() dto: AssignWorkWeekPatternDto, @Request() req: any) {
    return this.workweeksService.assignPattern(dto, req.user?.id);
  }

  @Get('assignments/:userId')
  findAssignmentsForUser(@Param('userId') userId: string) {
    return this.workweeksService.findAssignmentsForUser(userId);
  }

  @Delete('assignments/:id')
  removeAssignment(@Param('id') id: string) {
    return this.workweeksService.removeAssignment(id);
  }

  @Post('overrides')
  createOverride(@Body() dto: CreateDayOverrideDto, @Request() req: any) {
    return this.workweeksService.createOverride(dto, req.user?.id);
  }

  @Post('swaps')
  createSwap(@Body() dto: CreateWeekdaySwapDto, @Request() req: any) {
    return this.workweeksService.createWeekdaySwap(dto, req.user?.id);
  }

  @Get('overrides/:userId')
  findOverridesForUser(@Param('userId') userId: string) {
    return this.workweeksService.findOverridesForUser(userId);
  }

  @Delete('overrides/:id')
  removeOverride(@Param('id') id: string) {
    return this.workweeksService.removeOverride(id);
  }
}
