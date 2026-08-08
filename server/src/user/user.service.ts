import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
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
import { MailDeliveryError, MailService } from 'src/mail/mail.service';
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
import { PasswordResetTokenModel } from './model/password-reset-token.model';
import { createHash, randomBytes, randomUUID } from 'crypto';

export interface AuthResponse extends Pick<TokenPair, 'accessToken'> {
  user: AuthenticatedPrincipal;
}

export interface AuthSession extends AuthResponse {
  refreshToken: string;
}

@Injectable()
export class UserService {
  private static readonly ACTIVATION_TTL_MS = 24 * 60 * 60 * 1000;
  private static readonly ACTIVATION_RESEND_COOLDOWN_MS = 60 * 1000;
  constructor(
    @InjectModel(UserModel) private readonly userRepository: typeof UserModel,
    @InjectModel(CollectionModel)
    private readonly collectionRepository: typeof CollectionModel,
    @InjectModel(PasswordResetTokenModel)
    private readonly passwordResetRepository: typeof PasswordResetTokenModel,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly fileService: FileService,
    private readonly config: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  private toPayload(user: UserModel): AccessTokenPayload {
    return { sub: user.id, email: user.email, ver: user.sessionVersion };
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
      mustChangePassword: user.mustChangePassword,
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

  private activationUrl(link: string): string {
    return `${this.config.getOrThrow<string>('API_URL')}/activate/${link}`;
  }

  private mailUnavailable(error: unknown): ServiceUnavailableException {
    return new ServiceUnavailableException({
      statusCode: 503,
      code: 'MAIL_DELIVERY_UNAVAILABLE',
      message: 'Email delivery is temporarily unavailable',
      ...(error instanceof MailDeliveryError && error.smtpCode
        ? { smtpCode: error.smtpCode }
        : {}),
    });
  }

  async registration(dto: CreateUserDto): Promise<{ success: true }> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('User already exists');

    const activationLink = uuid.v4();
    const now = new Date();
    try {
      await this.sequelize.transaction(async (transaction) => {
        const createdUser = await this.userRepository.create(
          {
            email: dto.email,
            password: await bcrypt.hash(dto.password, 10),
            activationLink,
            activationSentAt: now,
            activationExpiresAt: new Date(
              now.getTime() + UserService.ACTIVATION_TTL_MS,
            ),
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
        await this.mailService.sendActivationMail(
          createdUser.email,
          this.activationUrl(activationLink),
        );
      });
    } catch (error) {
      if (error instanceof MailDeliveryError) throw this.mailUnavailable(error);
      throw error;
    }
    return { success: true };
  }

  async activate(activationLink: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { activationLink },
    });
    if (
      !user ||
      !user.activationExpiresAt ||
      user.activationExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Invalid or expired activation link');
    }
    user.isActivated = true;
    user.activationLink = null;
    user.activationExpiresAt = null;
    user.activationSentAt = null;
    await user.save();
  }

  async resendActivation(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.isActivated || user.accountStatus !== 'active') return;
    const now = new Date();
    if (
      user.activationSentAt &&
      now.getTime() - user.activationSentAt.getTime() <
        UserService.ACTIVATION_RESEND_COOLDOWN_MS
    ) {
      return;
    }

    const link = uuid.v4();
    try {
      await this.sequelize.transaction(async (transaction) => {
        const locked = await this.userRepository.findByPk(user.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!locked || locked.isActivated || locked.accountStatus !== 'active')
          return;
        locked.activationLink = link;
        locked.activationSentAt = now;
        locked.activationExpiresAt = new Date(
          now.getTime() + UserService.ACTIVATION_TTL_MS,
        );
        await this.mailService.sendActivationMail(
          locked.email,
          this.activationUrl(link),
        );
        await locked.save({ transaction });
      });
    } catch (error) {
      if (error instanceof MailDeliveryError) throw this.mailUnavailable(error);
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Account is unavailable');
    }
    if (!user.isActivated) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'EMAIL_NOT_ACTIVATED',
        message: 'Email address is not activated',
      });
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
    if (
      user.accountStatus !== 'active' ||
      (payload.ver ?? 0) !== user.sessionVersion
    ) {
      throw new UnauthorizedException('Session has been revoked');
    }

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
    const now = new Date();
    try {
      await this.sequelize.transaction(async (transaction) => {
        await this.mailService.sendActivationMail(
          dto.newEmail,
          this.activationUrl(activationLink),
        );
        user.email = dto.newEmail;
        user.activationLink = activationLink;
        user.activationSentAt = now;
        user.activationExpiresAt = new Date(
          now.getTime() + UserService.ACTIVATION_TTL_MS,
        );
        user.isActivated = false;
        user.sessionVersion += 1;
        await user.save({ transaction });
        await this.tokenService.removeAllForUser(user.id, transaction);
      });
    } catch (error) {
      if (error instanceof MailDeliveryError) throw this.mailUnavailable(error);
      throw error;
    }
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
      user.mustChangePassword = false;
      user.sessionVersion += 1;
      await user.save({ transaction });
      await this.tokenService.removeAllForUser(user.id, transaction);
    });
  }

  async issuePasswordReset(userId: number): Promise<string> {
    const user = await this.getRequiredUser(userId);
    if (user.accountStatus !== 'active') {
      throw new BadRequestException(
        'Password reset is available only for active accounts',
      );
    }
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.sequelize.transaction(async (transaction) => {
      await this.passwordResetRepository.destroy({
        where: { userId, usedAt: null },
        transaction,
      });
      await this.passwordResetRepository.create(
        {
          id: randomUUID(),
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          usedAt: null,
          createdAt: new Date(),
        },
        { transaction },
      );
    });
    return token;
  }

  async finalizePasswordResetDelivery(userId: number): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const user = await this.userRepository.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) throw new NotFoundException('User not found');
      user.sessionVersion += 1;
      await user.save({ transaction });
      await this.tokenService.removeAllForUser(userId, transaction);
    });
  }

  async cancelPasswordReset(token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.passwordResetRepository.destroy({ where: { tokenHash } });
  }

  async confirmPasswordReset(token: string, password: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.sequelize.transaction(async (transaction) => {
      const reset = await this.passwordResetRepository.findOne({
        where: { tokenHash, usedAt: null },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!reset || reset.expiresAt.getTime() <= Date.now())
        throw new BadRequestException(
          'Password reset token is invalid or expired',
        );
      const user = await this.userRepository.findByPk(reset.userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user || user.accountStatus !== 'active')
        throw new BadRequestException('Account is unavailable');
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = false;
      user.sessionVersion += 1;
      await user.save({ transaction });
      await reset.update({ usedAt: new Date() }, { transaction });
      await this.tokenService.removeAllForUser(user.id, transaction);
    });
  }
}
