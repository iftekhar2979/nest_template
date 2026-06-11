import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './schema/branch.schema';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async create(dto: CreateBranchDto, actorId?: string): Promise<Branch> {
    const existing = await this.branchRepo.findOne({
      where: { branchName: dto.branchName, companyId: dto.companyId },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Branch already exists for this company');
    }
    return this.branchRepo.save(
      this.branchRepo.create({ ...dto, createdBy: actorId ?? null }),
    );
  }

  findAll(): Promise<Branch[]> {
    return this.branchRepo.find({ order: { branchName: 'ASC' } });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    actorId?: string,
  ): Promise<Branch> {
    await this.findOne(id);
    await this.branchRepo.update({ id }, { ...dto, updatedBy: actorId ?? null });
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.branchRepo.softDelete({ id });
    return { message: 'Branch deleted successfully' };
  }
}
