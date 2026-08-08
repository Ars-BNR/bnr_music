import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { RbacService } from 'src/rbac/rbac.service';
import { TokenService } from 'src/token/token.service';
import { UserModel } from 'src/user/model/user.model';
import { UserService } from 'src/user/user.service';
import { AuthorModel } from 'src/author/model/author.model';
import { PasswordResetTokenModel } from 'src/user/model/password-reset-token.model';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(UserModel) private readonly users: typeof UserModel,
    @InjectModel(AuthorModel) private readonly authors: typeof AuthorModel,
    @InjectModel(PasswordResetTokenModel)
    private readonly passwordResets: typeof PasswordResetTokenModel,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly rbac: RbacService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  async list(query = '', status: string | undefined, count = 20, offset = 0) {
    const where = {
      ...(status ? { accountStatus: status } : {}),
      ...(query
        ? {
            [Op.or]: [
              { email: { [Op.iLike]: `%${query}%` } },
              { displayName: { [Op.iLike]: `%${query}%` } },
            ],
          }
        : {}),
    };
    const { rows, count: total } = await this.users.findAndCountAll({
      where,
      attributes: [
        'id',
        'email',
        'displayName',
        'accountStatus',
        'blockedAt',
        'deletedAt',
      ],
      order: [['id', 'ASC']],
      limit: count,
      offset,
    });
    return {
      items: await Promise.all(
        rows.map(async (user) => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          accountStatus: user.accountStatus,
          blockedAt: user.blockedAt,
          deletedAt: user.deletedAt,
          ...(await this.rbac.resolvePrincipal(user.id)),
        })),
      ),
      total,
    };
  }

  private async ensureTarget(
    actorId: number,
    userId: number,
    transaction: Transaction,
  ) {
    if (actorId === userId)
      throw new ForbiddenException('You cannot manage your own account');
    const user = await this.users.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setStatus(
    actorId: number,
    userId: number,
    status: 'active' | 'blocked' | 'deleted',
  ) {
    return this.sequelize.transaction(async (transaction) => {
      const user = await this.ensureTarget(actorId, userId, transaction);
      if (status === 'active' && user.accountStatus === 'active')
        return { success: true };
      if (status !== 'active')
        await this.rbac.assertUserCanLoseManageAccess(userId, transaction);
      user.accountStatus = status;
      user.blockedAt = status === 'blocked' ? new Date() : null;
      user.deletedAt = status === 'deleted' ? new Date() : null;
      user.sessionVersion += 1;
      await user.save({ transaction });
      await this.tokens.removeAllForUser(user.id, transaction);
      return { success: true };
    });
  }

  async resetPassword(actorId: number, userId: number) {
    if (actorId === userId)
      throw new ForbiddenException('You cannot reset your own password here');
    const user = await this.users.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.accountStatus !== 'active')
      throw new ForbiddenException(
        'Password can be reset only for an active account',
      );

    const seedAuthor = /^seed-author-\d+@bnr\.local$/i.test(user.email)
      ? await this.authors.findOne({ where: { userId: user.id } })
      : null;
    if (seedAuthor) {
      const temporaryPassword = randomBytes(18).toString('base64url');
      await this.sequelize.transaction(async (transaction) => {
        const locked = await this.users.findByPk(user.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!locked) throw new NotFoundException('User not found');
        locked.password = await bcrypt.hash(temporaryPassword, 10);
        locked.mustChangePassword = true;
        locked.sessionVersion += 1;
        await locked.save({ transaction });
        await this.tokens.removeAllForUser(locked.id, transaction);
        await this.passwordResets.destroy({
          where: { userId: locked.id },
          transaction,
        });
      });
      return { mode: 'temporary-password' as const, temporaryPassword };
    }

    if (!this.mail.isEnabled)
      throw new ServiceUnavailableException(
        'Password reset email is unavailable: SMTP is not configured',
      );
    const token = await this.userService.issuePasswordReset(userId);
    try {
      await this.mail.sendPasswordResetMail(
        user.email,
        `${this.config.getOrThrow<string>('CLIENT_URL')}/reset-password?token=${encodeURIComponent(token)}`,
      );
      await this.userService.finalizePasswordResetDelivery(userId);
      return { mode: 'email' as const };
    } catch (error) {
      await this.userService.cancelPasswordReset(token).catch(() => undefined);
      throw new ServiceUnavailableException(
        'Password reset email could not be sent. Existing sessions were preserved.',
        { cause: error },
      );
    }
  }
}
