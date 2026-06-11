import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from '../otp.schema';

@Injectable()
export class OtpRepository {
  constructor(
    @InjectRepository(Otp) private readonly otpRepo: Repository<Otp>,
  ) {}

  async create(data: Partial<Otp>): Promise<Otp> {
    return this.otpRepo.save(this.otpRepo.create(data));
  }

  async upsertForUser(data: {
    userID: string;
    oneTimePassword: string;
    expiredAt: Date;
  }): Promise<Otp> {
    const existing = await this.otpRepo.findOne({
      where: { userID: data.userID },
    });

    if (existing) {
      existing.oneTimePassword = data.oneTimePassword;
      existing.expiredAt = data.expiredAt;
      existing.attempts = 0;
      return this.otpRepo.save(existing);
    }

    return this.otpRepo.save(
      this.otpRepo.create({
        userID: data.userID,
        oneTimePassword: data.oneTimePassword,
        expiredAt: data.expiredAt,
        attempts: 0,
      }),
    );
  }

  async findByUserId(userId: string): Promise<Otp | null> {
    return this.otpRepo
      .createQueryBuilder('otp')
      .addSelect('otp.oneTimePassword')
      .where('otp.userID = :userId', { userId })
      .getOne();
  }

  async findByUserIdAndCode(userId: string, code: string): Promise<Otp | null> {
    return this.otpRepo
      .createQueryBuilder('otp')
      .addSelect('otp.oneTimePassword')
      .where('otp.userID = :userId', { userId })
      .andWhere('otp.oneTimePassword = :code', { code })
      .getOne();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.otpRepo.delete({ userID: userId });
  }

  async incrementAttempts(otpId: string): Promise<void> {
    await this.otpRepo.increment({ id: otpId }, 'attempts', 1);
  }
}
