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
import { HolidaysService } from './holidays.service';
import {
  CreateHolidayDto,
  UpdateHolidayDto,
  HolidayResponseDto,
  HolidayDeleteResponseDto,
  QueryHolidayDto,
} from './dto/holiday.dto';

@ApiTags('Holidays')
@ApiBearerAuth()
@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new holiday' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The holiday has been successfully created.',
    type: HolidayResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions.' })
  create(@Body() dto: CreateHolidayDto, @Request() req: any) {
    return this.holidaysService.create(dto, req.user?.id);
  }

  // Any authenticated user can view the holiday calendar
  @Get()
  @Roles(...Object.values(RoleType))
  @ApiOperation({
    summary:
      'List holidays with pagination and filtering (search, region, holidayListId, isRecurring, date range)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Paginated list of holidays: { data: HolidayResponseDto[], pagination }.',
    type: [HolidayResponseDto],
  })
  findAll(@Query() query: QueryHolidayDto) {
    return this.holidaysService.findAll(query);
  }

  @Get(':id')
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Get a holiday by ID' })
  @ApiParam({ name: 'id', description: 'Holiday UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The holiday has been successfully retrieved.',
    type: HolidayResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Holiday not found.' })
  findOne(@Param('id') id: string) {
    return this.holidaysService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update a holiday' })
  @ApiParam({ name: 'id', description: 'Holiday UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The holiday has been successfully updated.',
    type: HolidayResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Holiday not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHolidayDto,
    @Request() req: any,
  ) {
    return this.holidaysService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a holiday' })
  @ApiParam({ name: 'id', description: 'Holiday UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The holiday has been successfully deleted.',
    type: HolidayDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Holiday not found.' })
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
