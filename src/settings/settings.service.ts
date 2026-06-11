import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './settings.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingRepo: Repository<Settings>,
  ) {}

  async seed(seedData: any): Promise<any> {
    for (const data of seedData) {
      const existing = await this.settingRepo.findOne({
        where: { key: data.key },
      });
      if (!existing) {
        await this.settingRepo.save(this.settingRepo.create(data));
        console.log(`Seeded: ${data.key}`);
      } else {
        console.log(`Already exists: ${data.key}`);
      }
    }
  }

  async getTermsAndConditions(): Promise<any> {
    return this.settingRepo.findOne({ where: { key: 'terms_and_condition' } });
  }

  async getAboutUs(): Promise<any> {
    return this.settingRepo.findOne({ where: { key: 'about_us' } });
  }

  async getPrivacyPolicy(): Promise<any> {
    return this.settingRepo.findOne({ where: { key: 'privacy_policy' } });
  }

  async editTermsAndConditions(content: string): Promise<void> {
    const find = await this.settingRepo.findOne({
      where: { key: 'terms_and_condition' },
    });
    find.content = content;
    await this.settingRepo.save(find);
  }

  async editAboutUs(content: string): Promise<void> {
    const find = await this.settingRepo.findOne({ where: { key: 'about_us' } });
    find.content = content;
    await this.settingRepo.save(find);
  }

  async editPrivacyPolicy(content: string): Promise<void> {
    const find = await this.settingRepo.findOne({
      where: { key: 'privacy_policy' },
    });
    find.content = content;
    await this.settingRepo.save(find);
  }
}
