import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Holiday } from './schema/holiday.schema';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
  ) {}

  create(dto: CreateHolidayDto, actorId?: string): Promise<Holiday> {
    return this.holidayRepo.save(
      this.holidayRepo.create({ ...dto, createdBy: actorId ?? null }),
    );
  }

  findAll(region?: string): Promise<Holiday[]> {
    return this.holidayRepo.find({
      where: region ? { region } : {},
      order: { date: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Holiday> {
    const holiday = await this.holidayRepo.findOne({ where: { id } });
    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }
    return holiday;
  }

  async update(
    id: string,
    dto: UpdateHolidayDto,
    actorId?: string,
  ): Promise<Holiday> {
    await this.findOne(id);
    await this.holidayRepo.update(
      { id },
      { ...dto, updatedBy: actorId ?? null },
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.holidayRepo.softDelete({ id });
    return { message: 'Holiday deleted successfully' };
  }

  /**
   * True if the given date (YYYY-MM-DD) is a holiday for the region
   * (or a global holiday). Honours yearly-recurring holidays by month/day.
   */
  async isHoliday(date: string, region = 'global'): Promise<boolean> {
    const candidates = await this.holidayRepo.find({
      where: { region: In(['global', region]) },
    });
    return this.matchesHolidayDate(candidates, date);
  }

  async isHolidayForEmployee(
    date: string,
    holidayListId?: string | null,
    region = 'global',
  ): Promise<boolean> {
    if (holidayListId) {
      const listCandidates = await this.holidayRepo.find({
        where: { holidayListId },
      });
      if (this.matchesHolidayDate(listCandidates, date)) {
        return true;
      }
    }

    return this.isHoliday(date, region);
  }

  private matchesHolidayDate(holidays: Holiday[], date: string): boolean {
    const monthDay = date.slice(5); // MM-DD
    return holidays.some((holiday) =>
      holiday.isRecurring
        ? holiday.date.slice(5) === monthDay
        : holiday.date === date,
    );
  }
}
