// src/gallery/gallery.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Request,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
//   import { FileUploadController } from '../common/multer/file-upload.service';
import { multerConfig } from 'src/common/multer/multer.config';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role-gurad';
import { Roles } from 'src/common/custom-decorator/role.decorator';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // Route for uploading a single image
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'files', maxCount: 10 }, // You can limit the number of files here
  ], multerConfig))  // Use the multer config to handle file uploads
  uploadFiles(@Request() req, @UploadedFiles() files: { files?: Express.Multer.File[] }) {
    let user = req.user;  // Assuming user info is in the request
    return this.galleryService.addImage(user, files.files);
  }
  // Route to get all uploaded images
  // @Get('images')
  // getAllImages() {

  // return   this.galleryService.getImages();
  // }
}
