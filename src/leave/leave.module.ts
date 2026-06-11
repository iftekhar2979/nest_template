import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveType } from './schema/leave-type.schema';
import { LeaveAllocation } from './schema/leave-allocation.schema';
import { LeaveLedgerEntry } from './schema/leave-ledger-entry.schema';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveType, LeaveAllocation, LeaveLedgerEntry]),
    EmployeesModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
