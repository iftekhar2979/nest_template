// src/gallery/gallery.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { Gallery } from './gallery.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/auth/interface/jwt.info.interfact';
import { FileType } from './interface/gallery.interface';

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel('Gallery') private readonly galleryModel: Model<Gallery>,
  ) {}

  // Save image file path (or any additional gallery info)
  async addImage(user: User, file: FileType[]): Promise<any> {
    // console.log(file);
    let count: number = await this.galleryModel.countDocuments({
      userID: user.id,
    });
    // console.log(count<=6);
    if (count > 7) {
      throw new BadRequestException(
        `You already have ${count} images in your gallery . You can't add more than 6 pictures in gallery!`,
      );
    }
    const images = file.map((singleFile: FileType) => {
      return {
        userID: user.id,
        profileID: user.profileID,
        imageURL: `${singleFile.destination.slice(7, singleFile.destination.length)}/${singleFile.filename}`,
      };
    });
    // console.log(images);
    let imageLengths = images.length;
    let totalImageWithOld = imageLengths + count;
    if (totalImageWithOld > 7) {
        // console.log('yes', totalImageWithOld);
      throw new BadRequestException(
        "You can't add more than 6 pictures in gallery!",
      );
    }
    await this.galleryModel.insertMany(images);
    return { message: 'Image uploaded successfully !', data: {} };
  }

  // Get all saved images
  //   getImages(): any {
  //     let galleryItems = this.images;

  //     return {
  //       message: 'Gallery Item retrived successfully',
  //       data: galleryItems,
  //     };
  //   }
}
