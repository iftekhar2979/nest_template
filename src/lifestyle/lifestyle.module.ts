import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LifeStyle, LifeStyleSchema } from './lifestyle.schema';
import { LifestyleService } from './lifestyle.service';
import { LifeStyleController } from './lifestyle.controller';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LifeStyle.name, schema: LifeStyleSchema },
    ]),
  ],
  providers: [LifestyleService],
  controllers: [LifeStyleController],
  exports: [LifestyleService], // need exporting if i want to use the service into another services
})
export class LifestyleModule {}
