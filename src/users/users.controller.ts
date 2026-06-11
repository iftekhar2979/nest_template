import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/createUser.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { RoleType, User } from './schema/users.schema';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Get current user account information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return current user info.', type: User })
  async accountInfoMe(@Request() req: any) {
    const id = req.user.id;
    return await this.userService.findOne(id);
  }

  @Patch('me')
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.', type: User })
  updateUserInfo(@Request() req: any, @Body() updateData: UpdateUserDto) {
    const id = req.user.id;
    return this.userService.update(id, updateData);
  }

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully.', type: User })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'List all users with pagination and search' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'term', required: false, description: 'Search term (name or email)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of users.' })
  findAll(@Query() query: { limit?: number; page?: number; term?: string }) {
    try {
      return this.userService.findAll({
        term: query.term || '',
        limit: (query.limit || 10).toString(),
        page: (query.page || 1).toString(),
      });
    } catch (error) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  @Get('/count')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Count total number of users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Total count of users.' })
  countDocument() {
    return this.userService.count();
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return user info.', type: User })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.', type: User })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully.' })
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Patch('/info/me')
  @Roles(...Object.values(RoleType))
  @ApiOperation({ summary: 'Update account information for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Account information updated successfully.', type: User })
  async updateAccountInformation(
    @Request() req: any,
    @Body() info: UpdateUserDto,
  ) {
    return this.userService.update(req.user.id, info);
  }
}
