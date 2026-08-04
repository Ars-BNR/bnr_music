import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import * as uuid from 'uuid';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { CollectionModel } from 'src/collection/model/collection.model';
import { MailService } from 'src/mail/mail.service';
import { TokenPair, TokenService } from 'src/token/token.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserModel } from './model/user.model';

export interface AuthResponse extends Pick<TokenPair, 'accessToken'> {
  user: AccessTokenPayload;
}

export interface AuthSession extends AuthResponse {
  refreshToken: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserModel) private readonly userRepository: typeof UserModel,
    @InjectModel(CollectionModel)
    private readonly collectionRepository: typeof CollectionModel,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private toPayload(user: UserModel): AccessTokenPayload {
    return { sub: user.id, email: user.email, role: user.role };
  }

  private async createSession(
    user: UserModel,
    transaction?: Transaction,
  ): Promise<AuthSession> {
    const payload = this.toPayload(user);
    const tokens = await this.tokenService.generateTokens(payload);
    await this.tokenService.saveToken(
      user.id,
      tokens.refreshToken,
      transaction,
    );
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: payload,
    };
  }

  async setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
  ): Promise<void> {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      maxAge: this.config.getOrThrow<number>('REFRESH_COOKIE_MAX_AGE'),
      path: '/',
    });
  }

  clearRefreshTokenCookie(response: Response): void {
    response.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
    });
  }

  async registration(dto: CreateUserDto): Promise<AuthSession> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('User already exists');

    const activationLink = uuid.v4();
    const session = await this.sequelize.transaction(async (transaction) => {
      const createdUser = await this.userRepository.create(
        {
          email: dto.email,
          password: await bcrypt.hash(dto.password, 10),
          activationLink,
        },
        { transaction },
      );
      await this.collectionRepository.create(
        { userId: createdUser.id },
        { transaction },
      );
      return this.createSession(createdUser, transaction);
    });

    await this.mailService.sendActivationMail(
      session.user.email,
      `${this.config.getOrThrow<string>('API_URL')}/activate/${activationLink}`,
    );
    return session;
  }

  async activate(activationLink: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { activationLink },
    });
    if (!user) throw new BadRequestException('Invalid activation link');
    user.isActivated = true;
    await user.save();
  }

  async login(dto: CreateUserDto): Promise<AuthSession> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createSession(user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not found');
    const payload = await this.tokenService.validateRefreshToken(refreshToken);
    await this.tokenService.removeToken(payload.sub, refreshToken);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not found');
    const payload = await this.tokenService.validateRefreshToken(refreshToken);
    const user = await this.userRepository.findByPk(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');

    const nextTokens = await this.tokenService.generateTokens(
      this.toPayload(user),
    );
    await this.tokenService.rotateToken(
      user.id,
      refreshToken,
      nextTokens.refreshToken,
    );
    return {
      accessToken: nextTokens.accessToken,
      refreshToken: nextTokens.refreshToken,
      user: this.toPayload(user),
    };
  }

  async getAllUsers(): Promise<UserModel[]> {
    return this.userRepository.findAll({
      attributes: { exclude: ['password'] },
    });
  }
}
