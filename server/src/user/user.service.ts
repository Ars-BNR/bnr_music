import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
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
import { FileService, FileType } from 'src/file/file.service';
import { MailService } from 'src/mail/mail.service';
import { TokenPair, TokenService } from 'src/token/token.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserModel } from './model/user.model';
import { UserProfileResponse } from './response/user-profile-response';
import { AuthenticatedPrincipal } from 'src/rbac/rbac.constants';
import { RbacService } from 'src/rbac/rbac.service';

export interface AuthResponse extends Pick<TokenPair, 'accessToken'> {
  user: AuthenticatedPrincipal;
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
    private readonly fileService: FileService,
    private readonly config: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  private toPayload(user: UserModel): AccessTokenPayload {
    return { sub: user.id, email: user.email };
  }

  private async toProfile(user: UserModel): Promise<UserProfileResponse> {
    const principal = await this.rbacService.resolvePrincipal(user.id);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio ?? '',
      avatar: user.avatar ?? null,
      roles: principal.roles,
      permissions: principal.permissions,
      isActivated: user.isActivated,
    };
  }

  private async getRequiredUser(userId: number): Promise<UserModel> {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private validateAvatar(
    file: Express.Multer.File | undefined,
  ): asserts file is Express.Multer.File {
    if (!file) throw new BadRequestException('Avatar file is required');
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Avatar must be 2 MiB or smaller');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException(
        'Avatar must be a JPEG, PNG, or WebP image',
      );
    }
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
      user: await this.rbacService.resolvePrincipal(user.id, transaction),
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
          displayName: dto.email.split('@')[0] || 'BNR',
        },
        { transaction },
      );
      await this.collectionRepository.create(
        { userId: createdUser.id },
        { transaction },
      );
      await this.rbacService.assignSystemRole(
        createdUser.id,
        'user',
        transaction,
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

  async login(dto: LoginDto): Promise<AuthSession> {
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
      user: await this.rbacService.resolvePrincipal(user.id),
    };
  }

  async getAllUsers(): Promise<UserModel[]> {
    return this.userRepository.findAll({
      attributes: { exclude: ['password'] },
    });
  }

  async getProfile(userId: number): Promise<UserProfileResponse> {
    return this.toProfile(await this.getRequiredUser(userId));
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const user = await this.getRequiredUser(userId);
    if (dto.displayName !== undefined && !dto.displayName) {
      throw new BadRequestException('Display name cannot be empty');
    }
    Object.assign(user, dto);
    await user.save();
    return this.toProfile(user);
  }

  async replaceAvatar(
    userId: number,
    file: Express.Multer.File | undefined,
  ): Promise<UserProfileResponse> {
    this.validateAvatar(file);
    const user = await this.getRequiredUser(userId);
    const previousAvatar = user.avatar;
    let avatar: string | undefined;

    try {
      avatar = this.fileService.createFile(FileType.IMAGE, file);
      await this.sequelize.transaction(async (transaction) => {
        user.avatar = avatar!;
        await user.save({ transaction });
      });
    } catch (error) {
      if (avatar) this.fileService.deleteFile(avatar);
      throw error;
    }

    if (previousAvatar) this.fileService.deleteFile(previousAvatar);
    return this.toProfile(user);
  }

  async removeAvatar(userId: number): Promise<UserProfileResponse> {
    const user = await this.getRequiredUser(userId);
    const previousAvatar = user.avatar;
    user.avatar = null;
    await user.save();
    if (previousAvatar) this.fileService.deleteFile(previousAvatar);
    return this.toProfile(user);
  }

  async changeEmail(userId: number, dto: ChangeEmailDto): Promise<void> {
    const user = await this.getRequiredUser(userId);
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.newEmail },
    });
    if (existing && existing.id !== user.id) {
      throw new ConflictException('Email is already in use');
    }

    const activationLink = uuid.v4();
    await this.sequelize.transaction(async (transaction) => {
      user.email = dto.newEmail;
      user.activationLink = activationLink;
      user.isActivated = false;
      await user.save({ transaction });
      await this.tokenService.removeAllForUser(user.id, transaction);
    });

    await this.mailService.sendActivationMail(
      dto.newEmail,
      `${this.config.getOrThrow<string>('API_URL')}/activate/${activationLink}`,
    );
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.getRequiredUser(userId);
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must differ from the current password',
      );
    }

    await this.sequelize.transaction(async (transaction) => {
      user.password = await bcrypt.hash(dto.newPassword, 10);
      await user.save({ transaction });
      await this.tokenService.removeAllForUser(user.id, transaction);
    });
  }
}
