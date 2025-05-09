// src/user/user.controller.ts
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
  ValidationPipe,
  BadRequestException,
  ConflictException,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Patch,
} from '@nestjs/common';
import { UserService } from './users.service';
import { IUser } from './users.interface';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { CreateUserDto } from './dto/createUser.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/common/custom-decorator/role.decorator';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig, multerS3Config } from 'src/common/multer/multer.config';

// import { PinService } from 'src/pin/pin.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  async accountInfoMe(@Request() req: any) {
    let id = req.user.id;
    console.log(req.user);
    return await this.userService.findOne(id);
  }
  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  updateUserInfo(@Request() req: any) {
    let id = req.user.id;
    return this.userService.update(id, req.body);
  }
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
   findAll(@Query() query: { limit: number; page: number ,term:string}) {
    try {
      return this.userService.findAll({
        ...query,
        limit: query.limit.toString(),
        page: query.page.toString(),
      });
    } catch (error) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
  @Get('/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
   countDocument() {
      return this.userService.count();
  
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
   findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
   update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.userService.update(id, updateUserDto);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Post('profile-picture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user','admin')
  @UseInterceptors(FileInterceptor('file', {storage:multerS3Config}))
  imagesUpload(@Request() req, @UploadedFile() file: Express.Multer.File) {
    let user = req.user; // Assuming user info is in the request
    console.log(file)
    return this.userService.uploadProfilePicture(user, file);
  }

  @Patch('/info/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateAccountInformation(
    @Request() req,
    @Body() info: { name?: string ,email?:string},
  ) {
    return this.userService.update(req.user.id, info);
  }
}
