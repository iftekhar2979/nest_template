import { Module } from '@nestjs/common';
import { SeederService } from './seedService';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '../auth/schema/role.schema';
import { RoleRepository } from '../auth/repositories/role.repository';

@Module({
  imports: [
    UsersModule,
    SettingsModule,
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  providers: [SeederService, RoleRepository],
  exports: [SeederService],
})
export class SeedModule {
}
