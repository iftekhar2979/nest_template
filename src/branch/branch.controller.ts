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
import { BranchService } from './branch.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  BranchResponseDto,
  BranchDeleteResponseDto,
} from './dto/branch.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The branch has been successfully created.',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Branch already exists for this company.' })
  create(@Body() dto: CreateBranchDto, @Request() req: any) {
    return this.branchService.create(dto, req.user?.id);
  }

  // Any authenticated user can view branches
  @Get()
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get all branches' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all branches retrieved successfully.',
    type: [BranchResponseDto],
  })
  findAll() {
    return this.branchService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get a branch by ID' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The branch has been successfully retrieved.',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Branch not found.' })
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update a branch' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The branch has been successfully updated.',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Branch not found.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @Request() req: any,
  ) {
    return this.branchService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The branch has been successfully deleted.',
    type: BranchDeleteResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Branch not found.' })
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
