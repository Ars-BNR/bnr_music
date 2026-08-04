import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Sequelize, Transaction } from 'sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { TokenModel } from './model/token.model';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(TokenModel)
    private readonly tokenRepository: typeof TokenModel,
  ) {}

  async generateTokens(user: AccessTokenPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(user, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow<string>('EXPIRES_ACCESS_JWT'),
      }),
      this.jwtService.signAsync(
        { jti: randomUUID(), ...user },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.getOrThrow<string>('EXPIRES_REFRESH_JWT'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  async validateRefreshToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async saveToken(
    userId: number,
    refreshToken: string,
    transaction?: Transaction,
  ): Promise<TokenModel> {
    const sessions = await this.tokenRepository.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
      transaction,
      lock: transaction?.LOCK.UPDATE,
    });
    if (sessions.length >= 2) {
      await sessions[0].destroy({ transaction });
    }
    return this.tokenRepository.create(
      { userId, refreshToken: await bcrypt.hash(refreshToken, 10) },
      { transaction },
    );
  }

  async findTokenForUser(
    userId: number,
    refreshToken: string,
    transaction?: Transaction,
  ): Promise<TokenModel | null> {
    const tokens = await this.tokenRepository.findAll({
      where: { userId },
      transaction,
    });
    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.refreshToken)) return token;
    }
    return null;
  }

  async rotateToken(
    userId: number,
    currentRefreshToken: string,
    nextRefreshToken: string,
  ): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const token = await this.findTokenForUser(
        userId,
        currentRefreshToken,
        transaction,
      );
      if (!token) throw new UnauthorizedException('Refresh session not found');
      await token.destroy({ transaction });
      await this.saveToken(userId, nextRefreshToken, transaction);
    });
  }

  async removeToken(userId: number, refreshToken: string): Promise<number> {
    const token = await this.findTokenForUser(userId, refreshToken);
    if (!token) return 0;
    await token.destroy();
    return 1;
  }

  async removeAllForUser(
    userId: number,
    transaction?: Transaction,
  ): Promise<number> {
    return this.tokenRepository.destroy({ where: { userId }, transaction });
  }
}
