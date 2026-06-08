import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { LeaveService } from './leave.service';
import {
  AllocateLeaveDto,
  CreateLeaveTypeDto,
  LeaveBalanceDto,
  LeaveTransactionDto,
  QueryAllocationDto,
  QueryLedgerDto,
  RunAccrualDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';

@ApiTags('Leave')
@ApiBearerAuth()
@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // --- Employee self-service ---

  @Get('me/balance')
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get my current leave balances (per leave type)' })
  @ApiResponse({ status: HttpStatus.OK, type: [LeaveBalanceDto] })
  async myBalance(@Request() req: any) {
    const employeeId = await this.leaveService.resolveEmployeeIdByUser(
      req.user.id,
    );
    return this.leaveService.getBalances(employeeId);
  }

  @Get('me/ledger')
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get my leave ledger (paginated)' })
  async myLedger(@Request() req: any, @Query() query: QueryLedgerDto) {
    const employeeId = await this.leaveService.resolveEmployeeIdByUser(
      req.user.id,
    );
    return this.leaveService.getLedger(employeeId, query);
  }

  // --- Leave types (admin) ---

  @Post('types')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create a leave type' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Code already exists.' })
  createType(@Body() dto: CreateLeaveTypeDto, @Request() req: any) {
    return this.leaveService.createType(dto, req.user?.id);
  }

  @Get('types')
  @Roles(RoleType.EMPLOYEE, RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'List all leave types' })
  findTypes() {
    return this.leaveService.findTypes();
  }

  @Get('types/:id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get a leave type by ID' })
  @ApiParam({ name: 'id', description: 'Leave type UUID' })
  findType(@Param('id') id: string) {
    return this.leaveService.findType(id);
  }

  @Patch('types/:id')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Update a leave type' })
  @ApiParam({ name: 'id', description: 'Leave type UUID' })
  updateType(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
    @Request() req: any,
  ) {
    return this.leaveService.updateType(id, dto, req.user?.id);
  }

  @Delete('types/:id')
  @Roles(RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a leave type' })
  @ApiParam({ name: 'id', description: 'Leave type UUID' })
  removeType(@Param('id') id: string) {
    return this.leaveService.removeType(id);
  }

  // --- Allocations (admin) ---

  @Post('allocations')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({
    summary:
      'Allocate annual entitlement to an employee (credits the ledger for lump-sum types)',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Allocation already exists.' })
  allocate(@Body() dto: AllocateLeaveDto, @Request() req: any) {
    return this.leaveService.allocate(dto, req.user?.id);
  }

  @Get('allocations')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: 'List allocations with pagination and filtering' })
  getAllocations(@Query() query: QueryAllocationDto) {
    return this.leaveService.getAllocations(query);
  }

  // --- Accrual (admin) ---

  @Post('accrual/run')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({
    summary:
      'Run monthly accrual for a given year/month (idempotent per allocation-month)',
  })
  runAccrual(@Body() dto: RunAccrualDto, @Request() req: any) {
    return this.leaveService.runMonthlyAccrual(dto, req.user?.id);
  }

  // --- Manual transactions (admin) ---

  @Post('transactions')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({
    summary: 'Record a usage / encashment / adjustment ledger entry',
  })
  transact(@Body() dto: LeaveTransactionDto, @Request() req: any) {
    return this.leaveService.transact(dto, req.user?.id);
  }

  // --- Admin balance / ledger lookups ---

  @Get('balance/:employeeId')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: "Get an employee's leave balances" })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: [LeaveBalanceDto] })
  balance(@Param('employeeId') employeeId: string) {
    return this.leaveService.getBalances(employeeId);
  }

  @Get('ledger/:employeeId')
  @Roles(RoleType.ADMIN, RoleType.SUPERADMIN)
  @ApiOperation({ summary: "Get an employee's leave ledger (paginated)" })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  ledger(
    @Param('employeeId') employeeId: string,
    @Query() query: QueryLedgerDto,
  ) {
    return this.leaveService.getLedger(employeeId, query);
  }
}
