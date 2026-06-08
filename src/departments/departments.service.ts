import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './schema/department.schema';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async create(
    dto: CreateDepartmentDto,
    actorId?: string,
  ): Promise<Department> {
    const existing = await this.departmentRepo.findOne({
      where: { departmentName: dto.departmentName },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Department name already exists');
    }
    return this.departmentRepo.save(
      this.departmentRepo.create({ ...dto, createdBy: actorId ?? null }),
    );
  }

  findAll(): Promise<Department[]> {
    return this.departmentRepo.find({ order: { departmentName: 'ASC' } });
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  async update(
    id: string,
    dto: UpdateDepartmentDto,
    actorId?: string,
  ): Promise<Department> {
    await this.findOne(id);
    await this.departmentRepo.update(
      { id },
      { ...dto, updatedBy: actorId ?? null },
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.departmentRepo.softDelete({ id });
    return { message: 'Department deleted successfully' };
  }
}
