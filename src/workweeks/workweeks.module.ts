import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../employees/schema/employee.schema';
import { EmployeeDayOverride } from './schema/employee-day-override.schema';
import { EmployeeWorkWeekAssignment } from './schema/employee-work-week-assignment.schema';
import { WorkWeekPattern } from './schema/work-week-pattern.schema';
import { WorkweeksController } from './workweeks.controller';
import { WorkweeksService } from './workweeks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkWeekPattern,
      EmployeeWorkWeekAssignment,
      EmployeeDayOverride,
      Employee,
    ]),
  ],
  controllers: [WorkweeksController],
  providers: [WorkweeksService],
  exports: [WorkweeksService],
})
export class WorkweeksModule {}
