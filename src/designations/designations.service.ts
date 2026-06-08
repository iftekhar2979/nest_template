import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Designation } from './schema/designation.schema';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectRepository(Designation)
    private readonly designationRepo: Repository<Designation>,
  ) {}

  create(dto: CreateDesignationDto, actorId?: string): Promise<Designation> {
    return this.designationRepo.save(
      this.designationRepo.create({ ...dto, createdBy: actorId ?? null }),
    );
  }

  findAll(departmentId?: string): Promise<Designation[]> {
    return this.designationRepo.find({
      where: departmentId ? { departmentId } : {},
      order: { title: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Designation> {
    const designation = await this.designationRepo.findOne({ where: { id } });
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }
    return designation;
  }

  async update(
    id: string,
    dto: UpdateDesignationDto,
    actorId?: string,
  ): Promise<Designation> {
    await this.findOne(id);
    await this.designationRepo.update(
      { id },
      { ...dto, updatedBy: actorId ?? null },
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.designationRepo.softDelete({ id });
    return { message: 'Designation deleted successfully' };
  }
}
