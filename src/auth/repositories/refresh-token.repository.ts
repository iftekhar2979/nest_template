import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { RefreshToken } from '../schema/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    return this.refreshTokenRepo.save(this.refreshTokenRepo.create(data));
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepo
      .createQueryBuilder('rt')
      .addSelect('rt.tokenHash')
      .where('rt.tokenHash = :tokenHash', { tokenHash })
      .getOne();
  }

  async consumeActiveByTokenHash(
    tokenHash: string,
    replacedByTokenHash: string,
  ): Promise<RefreshToken | null> {
    const token = await this.refreshTokenRepo
      .createQueryBuilder('rt')
      .addSelect('rt.tokenHash')
      .where('rt.tokenHash = :tokenHash', { tokenHash })
      .andWhere('rt.isRevoked = false')
      .andWhere('rt.expiresAt > :now', { now: new Date() })
      .getOne();

    if (!token) {
      return null;
    }

    token.isRevoked = true;
    token.revokedAt = new Date();
    token.replacedByTokenHash = replacedByTokenHash;
    return this.refreshTokenRepo.save(token);
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepo.find({
      where: { userId, isRevoked: false, expiresAt: MoreThan(new Date()) },
    });
  }

  async revokeByTokenHash(
    tokenHash: string,
    replacedByTokenHash?: string,
  ): Promise<void> {
    await this.refreshTokenRepo.update(
      { tokenHash },
      {
        isRevoked: true,
        revokedAt: new Date(),
        ...(replacedByTokenHash ? { replacedByTokenHash } : {}),
      },
    );
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }
}
