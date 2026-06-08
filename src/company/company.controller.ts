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
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyResponseDto,
  CompanyDeleteResponseDto,
} from './dto/company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The company has been successfully created.',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Company name already exists.' })
  create(@Body() dto: CreateCompanyDto, @Request() req: any) {
    return this.companyService.create(dto, req.user?.id);
  }

  // Any authenticated user can view companies
  @Get()
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all companies retrieved successfully.',
    type: [CompanyResponseDto],
  })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiParam({ name: 'id', description: 'Company UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The company has been successfully retrieved.',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Company not found.' })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', description: 'Company UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The company has been successfully updated.',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Company not found.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @Request() req: any,
  ) {
    return this.companyService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', description: 'Company UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The company has been successfully deleted.',
    type: CompanyDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Company not found.' })
  remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
